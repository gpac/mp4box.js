var MultiTracksMediaSource = function() {
	this.ms = new nativeMediaSource();
	this.sourceBuffers = [];
}

MultiTracksMediaSource.prototype.getMediaSource = function() {
	return this.ms;
}

MultiTracksMediaSource.prototype.addSourceBuffer = function(type) {
	if (!nativeMediaSource.isTypeSupported(type)) {
		return null;
	} else {
		var mtsb = new MultiTracksSourceBuffer(this, type);
		this.sourceBuffers.push(mtsb);
		return mtsb;
	}
}

MultiTracksMediaSource.prototype.addEventListener = function(a, b, c) {
	var mtms = this;
	var callback = function(event) {
		event.target_mtms = mtms;
		b(event);
	}
	return this.ms.addEventListener(a,callback.bind(mtms),c);
}

MultiTracksMediaSource.prototype.removeEventListener = function(a) {
	var mtms = this;
	return this.ms.removeEventListener(a);
}

window.nativeMediaSource = MediaSource;
window.MediaSource = MultiTracksMediaSource;

var MultiTracksSourceBuffer = function(mtms,type) {
	var mtsb = this;
	mtsb.mtms = mtms;
	this.sb = mtms.ms.addSourceBuffer(type);
	this.sb.ms = mtms.ms;
	this.sb.pendingAppends = [];
	this.sb.onUpdateEnd = function(isNotInit, isEndOfAppend) {
		if (isEndOfAppend === true) {
			if (mtsb.output.sampleNum) {
				mtsb.output.releaseUsedSamples(mtsb.output_track_id, mtsb.output.sampleNum);
				delete mtsb.output.sampleNum;
			}
			if (this.is_last) {
				mediaSource.endOfStream();
			}
		}
		if (mtms.ms.readyState === "open" && this.updating === false && this.pendingAppends.length > 0) {
			var obj = this.pendingAppends.shift();
			this.sampleNum = obj.sampleNum;
			this.is_last = obj.is_last;
			this.appendBuffer(obj.buffer);
		}
		mtsb.buffered = this.buffered;
	}
	this.sb.onInitAppended = function(e) {
		var sb = e.target;
		if (sb.ms.readyState === "open") {
			sb.sampleNum = 0;
			sb.removeEventListener('updateend', sb.onInitAppended);
			sb.addEventListener('updateend', sb.onUpdateEnd.bind(sb, true, true));
			/* In case there are already pending buffers we call onUpdateEnd to start appending them*/
			sb.onUpdateEnd.call(sb, false, true);
		}
	}
	this.sb.addEventListener('updateend', this.sb.onUpdateEnd.bind(this.sb, true, true));

	this.input = MP4Box.createFile();
	this.output = MP4Box.createFile();

	this.input.mtsb = this;
	this.output.mtsb = this;

	this.input.onError = function(e) { throw new DOMException(e); };
	this.input.onReady = function(info) {
		mtsb.mp4boxinfo = info;
		// find main track
		mtsb.main_track = info.tracks[0];
		mtsb.main_track.samples = [];
		this.setExtractionOptions(mtsb.main_track.id, mtsb.main_track, {nbSamples: 1});
		mtsb.secondary_track = info.tracks[1];
		mtsb.secondary_track.samples = [];
		this.setExtractionOptions(mtsb.secondary_track.id, mtsb.secondary_track, {nbSamples: 1});
		this.start();

		var trak = mtsb.input.getTrackById(mtsb.main_track.id);
		mtsb.output.ftyp = mtsb.input.ftyp;
		mtsb.output.moov = new BoxParser.moovBox();
		mtsb.output.moov.mvhd = mtsb.input.moov.mvhd;
	    mtsb.output.moov.boxes.push(mtsb.input.moov.mvhd);
		mtsb.output.moov.boxes.push(trak);
		mtsb.output.moov.traks.push(trak);
		mtsb.output.moov.mvex = mtsb.input.moov.mvex;
		mtsb.output.moov.boxes.push(mtsb.input.moov.mvex);

		//mtsb.output_track_id = mtsb.output.addTrack(outputTrackOptions);
		mtsb.output_track_id = mtsb.main_track.id;
		mtsb.output.setSegmentOptions(mtsb.output_track_id, mtsb.sb, { nbSamples: 1 } );
		var initSegments = mtsb.output.initializeSegmentation();
		mtsb.sb.addEventListener("updateend", mtsb.sb.onInitAppended.bind(mtsb.sb));
		mtsb.sb.appendBuffer(initSegments[0].buffer);
		mtsb.output.onSegment = function (id, user, buffer, sampleNum, is_last) {
			var sb = user;
			sb.pendingAppends.push({ id: id, buffer: buffer, sampleNum: sampleNum, is_last: is_last });
			sb.onUpdateEnd.call(sb, true, false);
		}
		mtsb.output.start();
	};
	this.input.onSamples = function (id, track, samples) {
		var other_track = null;
		if (track === mtsb.main_track) {
			other_track = mtsb.secondary_track;
			mtsb.main_track.samples.push(samples[0]);
		} else {
			other_track = mtsb.main_track;
			mtsb.secondary_track.samples.push(samples[0]);
		}
		if (other_track.samples.length > 0) {
			var track_selector = Math.floor(Math.random() * 2);
			var sample;
			if (track_selector === 1) {
				sample = mtsb.main_track.samples.shift();
				mtsb.secondary_track.samples.shift();
			} else {
				mtsb.main_track.samples.shift();
				sample = mtsb.secondary_track.samples.shift();
			}
			sample.sample_description_index = sample.description_index;
			mtsb.output.addSample(mtsb.output_track_id, sample.data, sample);
		}
	}
}

MultiTracksSourceBuffer.prototype.addEventListener = function(a, b, c){
	var mtsb = this;
	var callback = function(event) {
		event.target_mtsb = mtsb;
		b(event);
	}
	this.sb.addEventListener(a, callback.bind(mtsb), c);
}

MultiTracksSourceBuffer.prototype.removeEventListener = function(a) {
	var mtsb = this;
	return this.sb.removeEventListener(a);
}

MultiTracksSourceBuffer.prototype.appendBuffer = function(data) {
	this.input.appendBuffer(data);
}

MultiTracksSourceBuffer.prototype.abort = function() {
	return this.sb.abort();
}

MultiTracksSourceBuffer.prototype.remove = function(start, end) {
	return this.sb.remove(start, end);
}

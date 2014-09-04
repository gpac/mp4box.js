/* 
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
 var MP4Box = function () {
	this.sampleListBuilt = false;
	this.inputStream = null;
	this.inputIsoFile = null;
	this.onMoovStart = null;
	this.moovStartSent = false;
	this.onReady = null;
	this.readySent = false;	
	this.onSegment = null;
	this.onSamples = null;
	this.onError = null;

	this.fragmentedTracks = new Array();
	this.extractedTracks = new Array();
	this.isFragmentationStarted = false;
	this.nextMoofNumber = 0;
}

MP4Box.prototype.setSegmentOptions = function(id, user, options) {
	var trak = this.inputIsoFile.getTrackById(id);
	if (trak) {
		var fragTrack = {};
		this.fragmentedTracks.push(fragTrack);
		fragTrack.id = id;
		fragTrack.user = user;
		fragTrack.nextSample = 0;
		fragTrack.stream = null;
		fragTrack.nb_samples = 1000;
		fragTrack.rapAlignement = true;
		if (options) {
			if (options.nb_samples != undefined) fragTrack.nb_samples = options.nbSamples;
			if (options.rapAlignement != undefined) fragTrack.rapAlignement = options.rapAlignement;
		}
	}
}

MP4Box.prototype.unsetSegmentOptions = function(id) {
	var index = -1;
	for (var i = 0; i < this.fragmentedTracks.length; i++) {
		var fragTrack = this.fragmentedTracks[i];
		if (fragTrack.id == id) {
			index = i;
		}
	}
	if (index > -1) {
		this.fragmentedTracks.splice(index, 1);
	}
}

MP4Box.prototype.setExtractionOptions = function(id, user, options) {
	var trak = this.inputIsoFile.getTrackById(id);
	if (trak) {
		var extractTrack = {};
		this.extractedTracks.push(extractTrack);
		extractTrack.id = id;
		extractTrack.user = user;
		extractTrack.nextSample = 0;
		extractTrack.nb_samples = 1000;
		extractTrack.samples = [];
		if (options) {
			if (options.nb_samples != undefined) extractTrack.nb_samples = options.nbSamples;
		}
	}
}

MP4Box.prototype.unsetExtractionOptions = function(id) {
	var index = -1;
	for (var i = 0; i < this.extractedTracks.length; i++) {
		var extractTrack = this.extractedTracks[i];
		if (extractTrack.id == id) {
			index = i;
		}
	}
	if (index > -1) {
		this.extractedTracks.splice(index, 1);
	}
}

MP4Box.prototype.createSingleSampleMoof = function(sample) {
	var moof = new BoxParser.moofBox();
	var mfhd = new BoxParser.mfhdBox();
	mfhd.sequence_number = this.nextMoofNumber;
	this.nextMoofNumber++;
	moof.boxes.push(mfhd);
	var traf = new BoxParser.trafBox();
	moof.boxes.push(traf);
	var tfhd = new BoxParser.tfhdBox();
	traf.boxes.push(tfhd);
	tfhd.track_id = sample.track_id;
	tfhd.flags = BoxParser.TFHD_FLAG_DEFAULT_BASE_IS_MOOF;
	var tfdt = new BoxParser.tfdtBox();
	traf.boxes.push(tfdt);
	tfdt.baseMediaDecodeTime = sample.dts;
	var trun = new BoxParser.trunBox();
	traf.boxes.push(trun);
	moof.trun = trun;
	trun.flags = BoxParser.TRUN_FLAGS_DATA_OFFSET | BoxParser.TRUN_FLAGS_DURATION | 
				 BoxParser.TRUN_FLAGS_SIZE | BoxParser.TRUN_FLAGS_FLAGS | 
				 BoxParser.TRUN_FLAGS_CTS_OFFSET;
	trun.data_offset = 0;
	trun.first_sample_flags = 0;
	trun.sample_count = 1;
	trun.sample_duration = new Array();
	trun.sample_duration[0] = sample.duration;
	trun.sample_size = new Array();
	trun.sample_size[0] = sample.size;
	trun.sample_flags = new Array();
	trun.sample_flags[0] = 0;
	trun.sample_composition_time_offset = new Array();
	trun.sample_composition_time_offset[0] = sample.cts - sample.dts;
	return moof;
}

MP4Box.prototype.createFragment = function(input, track_id, sampleNumber, stream_) {
	var trak = this.inputIsoFile.getTrackById(track_id);
	var sample = this.inputIsoFile.getSample(trak, sampleNumber);
	if (sample == null) {
		return null;
	}
	
	var stream = stream_ || new DataStream();
	stream.endianness = DataStream.BIG_ENDIAN;

	var moof = this.createSingleSampleMoof(sample);
	moof.write(stream);

	/* adjusting the data_offset now that the moof size is known*/
	moof.trun.data_offset = moof.size+8; //8 is mdat header
	Log.d("BoxWriter", "Adjusting data_offset with new value "+moof.trun.data_offset);
	stream.adjustUint32(moof.trun.data_offset_position, moof.trun.data_offset);
		
	var mdat = new BoxParser.mdatBox();
	mdat.data = sample.data;
	mdat.write(stream);
	return stream;
}

/* helper functions to enable calling "open" with additional buffers */
ArrayBuffer.concat = function(buffer1, buffer2) {
  Log.d("ArrayBuffer", "Trying to create a new buffer of size: "+(buffer1.byteLength + buffer2.byteLength));
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

MP4Box.prototype.open = function(ab) {
	
	/* if we don't have a DataStream object yet, we create it, otherwise we concatenate the new one with the existing one. */
	if (!this.inputStream) {
		this.inputStream = new DataStream(ab, 0, DataStream.BIG_ENDIAN);	
		this.inputStream.buffer.fileStart = 0;
		ab.usedBytes = 0;
		this.inputStream.nextBuffers = [];
	} else {
		if (ab.byteLength>0) {
			this.inputStream.nextBuffers.push(ab);
			ab.usedBytes = 0;
		}
	}
	/* Initialize the ISOFile object if not yet created */
	if (!this.inputIsoFile) {
		this.inputIsoFile = new ISOFile(this.inputStream);
	}
	/* Parse whatever is already in the buffer */
	this.inputIsoFile.parse();
	if (this.inputIsoFile.moovStartFound && !this.moovStartSent) {
		this.moovStartSent = true;
		if (this.onMoovStart) this.onMoovStart();
	}
	
	if (!this.inputIsoFile.moov) {
		/* The parsing has not yet found a moov, not much can be done */
		return false;	
	} else {
		/* A moov box has been found */
		
		/* if this is the first call after the moov is found we initialize the list of samples (may be empty in fragmented files) */
		if (!this.sampleListBuilt) {
			this.inputIsoFile.buildSampleLists();
			this.sampleListBuilt = true;
		} 
		/* We update the sample information if there are any new moof boxes */
		this.inputIsoFile.updateSampleLists();
		
		/* If the application needs to be informed that the 'moov' has been found, 
		   we create the information object and callback the application */
		if (this.onReady && !this.readySent) {
			var info = this.getInfo();
			this.readySent = true;
			this.onReady(info);
		}	
		
		return true;
	}
}

MP4Box.prototype.processSamples = function() {
	/* For each track marked for fragmentation, 
	   check if the next sample is there (i.e. if the sample information is known (i.e. moof has arrived) and if it has been downloaded) and create a fragment with it */
	if (this.isFragmentationStarted) {
		for (var i = 0; i < this.fragmentedTracks.length; i++) {
			var fragTrak = this.fragmentedTracks[i];
			var trak = this.inputIsoFile.getTrackById(fragTrak.id);			
			while (fragTrak.nextSample < trak.samples.length) {				
				/* The sample information is there (either because the file is not fragmented and this is not the last sample, 
				or because the file is fragmented and the moof for that sample has been received */
				Log.d("MP4Box", "Creating media fragment on track #"+fragTrak.id +" for sample "+fragTrak.nextSample); 
				var result = this.createFragment(this.inputIsoFile, fragTrak.id, fragTrak.nextSample, fragTrak.stream);
				if (result) {
					fragTrak.stream = result;
					fragTrak.nextSample++;
				} else {
					/* The fragment could not be created because the media data is not there (not downloaded), wait for it */
					break;
				}
				/* A fragment is created by sample, but the segment is the accumulation in the buffer of these fragments.
				   It is flushed only as requested by the application (nb_samples) to avoid too many callbacks */
				if (fragTrak.nextSample % fragTrak.nb_samples == 0 || fragTrak.nextSample >= trak.samples.length) {
					Log.i("MP4Box", "Sending fragmented data on track #"+fragTrak.id+" for samples ["+(fragTrak.nextSample-fragTrak.nb_samples)+","+(fragTrak.nextSample-1)+"]"); 
					if (this.onSegment) {
						this.onSegment(fragTrak.id, fragTrak.user, fragTrak.stream.buffer, fragTrak.nextSample);
					}
					/* force the creation of a new buffer */
					fragTrak.stream = null;
				}
			}
		}
	}

	/* For each track marked for data export, 
	   check if the next sample is there (i.e. has been downloaded) and send it */
	for (var i = 0; i < this.extractedTracks.length; i++) {
		var extractTrak = this.extractedTracks[i];
		var trak = this.inputIsoFile.getTrackById(extractTrak.id);			
		while (extractTrak.nextSample < trak.samples.length) {				
			Log.i("MP4Box", "Exporting on track #"+extractTrak.id +" sample "+extractTrak.nextSample); 			
			var sample = this.inputIsoFile.getSample(trak, extractTrak.nextSample);
			if (sample) {
				extractTrak.nextSample++;
				extractTrak.samples.push(sample);
			} else {
				return;
			}
			if (extractTrak.nextSample % extractTrak.nb_samples == 0 || extractTrak.nextSample >= trak.samples.length) {
				Log.i("MP4Box", "Sending samples on track #"+extractTrak.id+" for sample "+extractTrak.nextSample); 
				if (this.onSamples) {
					this.onSamples(extractTrak.id, extractTrak.user, extractTrak.samples);
				}
				extractTrak.samples = [];
			}
		}
	}
}

MP4Box.prototype.appendBuffer = function(ab) {
	var stream;
	var is_open = this.open(ab);
	if (!is_open) return;
	this.processSamples();
}

MP4Box.prototype.getInfo = function() {
	var movie = {};
	movie.duration = this.inputIsoFile.moov.mvhd.duration;
	movie.timescale = this.inputIsoFile.moov.mvhd.timescale;
	movie.isFragmented = (this.inputIsoFile.moov.mvex != null);
	if (movie.isFragmented) {
		movie.fragment_duration = this.inputIsoFile.moov.mvex.mehd.fragment_duration;
	}
	movie.isProgressive = this.inputIsoFile.isProgressive;
	movie.hasIOD = (this.inputIsoFile.moov.iods != null);
	movie.brands = []; 
	movie.brands.push(this.inputIsoFile.ftyp.major_brand);
	movie.brands = movie.brands.concat(this.inputIsoFile.ftyp.compatible_brands);
	var _1904 = (new Date(4, 0, 1, 0, 0, 0, 0).getTime());
	movie.created = new Date(_1904+this.inputIsoFile.moov.mvhd.creation_time*1000);
	movie.modified = new Date(_1904+this.inputIsoFile.moov.mvhd.modification_time*1000);
	movie.tracks = new Array();
	movie.audioTracks = new Array();
	movie.videoTracks = new Array();
	movie.subtitleTracks = new Array();
	movie.metadataTracks = new Array();
	movie.hintTracks = new Array();
	for (i = 0; i < this.inputIsoFile.moov.traks.length; i++) {
		var trak = this.inputIsoFile.moov.traks[i];
		var sample_desc = trak.mdia.minf.stbl.stsd.entries[0];
		var track = {};
		movie.tracks.push(track);
		track.id = trak.tkhd.track_id;
		track.references = [];
		if (trak.tref) {
			for (j = 0; j < trak.tref.boxes.length; j++) {
				var ref = {};
				track.references.push(ref);
				ref.type = trak.tref.boxes[j].type;
				ref.track_ids = trak.tref.boxes[j].track_ids;
			}
		}
		track.created = new Date(_1904+trak.tkhd.creation_time*1000);
		track.modified = new Date(_1904+trak.tkhd.modification_time*1000);
		track.movie_duration = trak.tkhd.duration;
		track.layer = trak.tkhd.layer;
		track.alternate_group = trak.tkhd.alternate_group;
		track.volume = trak.tkhd.volume;
		track.matrix = trak.tkhd.matrix;
		track.track_width = trak.tkhd.width/(1<<16);
		track.track_height = trak.tkhd.height/(1<<16);
		track.timescale = trak.mdia.mdhd.timescale;
		track.duration = trak.mdia.mdhd.duration;
		track.codec = sample_desc.getCodec();	
		track.language = trak.mdia.mdhd.languageString;
		track.nb_samples = trak.samples.length;
		if (sample_desc.isAudio()) {
			movie.audioTracks.push(track);
			track.audio = {};
			track.audio.sample_rate = sample_desc.getSampleRate();		
			track.audio.channel_count = sample_desc.getChannelCount();		
			track.audio.sample_size = sample_desc.getSampleSize();		
		} else if (sample_desc.isVideo()) {
			movie.videoTracks.push(track);
			track.video = {};
			track.video.width = sample_desc.getWidth();		
			track.video.height = sample_desc.getHeight();		
		} else if (sample_desc.isSubtitle()) {
			movie.subtitleTracks.push(track);
		} else if (sample_desc.isHint()) {
			movie.hintTracks.push(track);
		} else if (sample_desc.isMetadata()) {
			movie.metadataTracks.push(track);
		}
	}
	return movie;
}

MP4Box.prototype.getInitializationSegment = function() {
	var stream = new DataStream();
	stream.endianness = DataStream.BIG_ENDIAN;
	this.inputIsoFile.writeInitializationSegment(stream);
	return stream.buffer;
}

MP4Box.prototype.initializeSegmentation = function() {
	if (!this.isFragmentationStarted) {
		this.isFragmentationStarted = true;		
		this.nextMoofNumber = 0;
		this.inputIsoFile.resetTables();
	}	
	var initSegs = new Array();
	for (var i = 0; i < this.fragmentedTracks.length; i++) {
		/* removing all tracks to create initialization segments with only one track */
		for (var j = 0; j < this.inputIsoFile.moov.boxes.length; j++) {
			var box = this.inputIsoFile.moov.boxes[j];
			if (box.type == "trak") {
				this.inputIsoFile.moov.boxes[j] = null;
			}
		}
		/* adding only the needed track */
		var trak = this.inputIsoFile.getTrackById(this.fragmentedTracks[i].id);
		for (var j = 0; j < this.inputIsoFile.moov.boxes.length; j++) {
			var box = this.inputIsoFile.moov.boxes[j];
			if (box == null) {
				this.inputIsoFile.moov.boxes[j] = trak;
			}
		}
		seg = {};
		seg.id = trak.tkhd.track_id;
		seg.user = this.fragmentedTracks[i].user;
		seg.buffer = this.getInitializationSegment();
		initSegs.push(seg);
	}
	return initSegs;
}

/* Called by the application to release the resources associated to samples already forwarded to the application */
MP4Box.prototype.releaseUsedSamples = function (id, sampleNum) {
    var start = new Date;
	var size = 0;
	var trak = this.inputIsoFile.getTrackById(id);
	if (!trak.lastValidSample) trak.lastValidSample = 0;
	for (var i = trak.lastValidSample; i < sampleNum; i++) {
		size+=this.inputIsoFile.releaseSample(trak, i);
	}
	Log.d("MP4Box", "Track #"+id+" released samples up to "+sampleNum+" (total size: "+size+", remaining: "+this.inputIsoFile.samplesDataSize+")");
	trak.lastValidSample = sampleNum;
}

/* Called by the application to flush the remaining samples, once the download is finished */
MP4Box.prototype.flush = function() {
	Log.i("MP4Box", "Flushing remaining samples");
	this.inputIsoFile.updateSampleLists();
	this.processSamples();
}

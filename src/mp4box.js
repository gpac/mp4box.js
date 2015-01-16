/* 
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var MP4Box = function () {
	/* DataStream object used to parse the boxes */
	this.inputStream = null;
	/* List of ArrayBuffers, with a fileStart property, sorted in order and non overlapping */
	this.nextBuffers = [];	
	/* ISOFile object containing the parsed boxes */
	this.inputIsoFile = null;
	/* Callback called when the moov parsing starts */
	this.onMoovStart = null;
	/* Boolean keeping track of the call to onMoovStart, to avoid double calls */
	this.moovStartSent = false;
	/* Callback called when the moov is entirely parsed */
	this.onReady = null;
	/* Boolean keeping track of the call to onReady, to avoid double calls */
	this.readySent = false;	
	/* Callback to call when segments are ready */
	this.onSegment = null;
	/* Callback to call when samples are ready */
	this.onSamples = null;
	/* Callback to call when there is an error in the parsing or processing of samples */	
	this.onError = null;
	/* Boolean indicating if the moov box run-length encoded tables of sample information have been processed */
	this.sampleListBuilt = false;

	this.fragmentedTracks = [];
	this.extractedTracks = [];
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
		fragTrack.trak = trak;
		trak.nextSample = 0;
		fragTrack.segmentStream = null;
		fragTrack.nb_samples = 1000;
		fragTrack.rapAlignement = true;
		if (options) {
			if (options.nbSamples) fragTrack.nb_samples = options.nbSamples;
			if (options.rapAlignement) fragTrack.rapAlignement = options.rapAlignement;
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
		extractTrack.trak = trak;
		trak.nextSample = 0;
		extractTrack.nb_samples = 1000;
		extractTrack.samples = [];
		if (options) {
			if (options.nbSamples) extractTrack.nb_samples = options.nbSamples;
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
	trun.sample_duration = [];
	trun.sample_duration[0] = sample.duration;
	trun.sample_size = [];
	trun.sample_size[0] = sample.size;
	trun.sample_flags = [];
	trun.sample_flags[0] = 0;
	trun.sample_composition_time_offset = [];
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

MP4Box.prototype.insertBuffer = function(ab) {	
	var smallB;
	var to_add = true;
	/* insert the new buffer in the sorted list of buffers, making sure, it is not overlapping with existing ones */
	/* nextBuffers is sorted by fileStart and there is no overlap */
	for (var i = 0; i < this.nextBuffers.length; i++) {
		var b = this.nextBuffers[i];
		if (ab.fileStart <= b.fileStart) {
			/* the insertion position is found */
			if (ab.fileStart === b.fileStart) {
				/* The new buffer overlaps with an existing buffer */
				if (ab.byteLength >  b.byteLength) {
					/* the new buffer is bigger than the existing one
					   remove the existing buffer and try again to insert 
					   the new buffer to check overlap with the next ones */
					this.nextBuffers.splice(i, 1);
					i--; 
					continue;
				} else {
					/* the new buffer is smaller than the existing one, just drop it */
					Log.w("MP4Box", "Buffer already appended, ignoring");
				}
			} else {
				/* The beginning of the new buffer is not overlapping with an existing buffer
				   let's check the end of it */
				if (ab.fileStart + ab.byteLength <= b.fileStart) {
					/* no overlap, we can add it as is */
					Log.d("MP4Box", "Appending new buffer (fileStart: "+ab.fileStart+" length:"+ab.byteLength+")");
					this.nextBuffers.splice(i, 0, ab);
					if (i === 0 && this.inputStream != null) {
						this.inputStream.buffer = ab;
					}
				} else {
					/* There is some overlap, cut the new buffer short, and add it*/
					smallB = new Uint8Array(b.fileStart - ab.fileStart);
					smallB.set(new Uint8Array(ab, 0, b.fileStart - ab.fileStart));
					smallB.buffer.fileStart = ab.fileStart;
					ab = smallB.buffer;
					ab.usedBytes = 0;
					Log.d("MP4Box", "Appending new buffer (fileStart: "+ab.fileStart+" length:"+ab.byteLength+")");
					this.nextBuffers.splice(i, 0, ab);
					if (i === 0 && this.inputStream != null) {
						this.inputStream.buffer = ab;
					}
				}
			}
			to_add = false;
			break;
		} else if (ab.fileStart < b.fileStart + b.byteLength) {
			/* the new buffer overlaps its beginning with the end of the current buffer */
			var offset = b.fileStart + b.byteLength - ab.fileStart;
			var newLength = ab.byteLength - offset;
			if (newLength > 0) {
				/* the new buffer is bigger than the current overlap, drop the overlapping part and try again inserting the remaining buffer */
				smallB = new Uint8Array(newLength);
				smallB.set(new Uint8Array(ab, offset, newLength));
				smallB.buffer.fileStart = ab.fileStart+offset;
				ab = smallB.buffer;
				ab.usedBytes = 0;
			} else {
				/* the content of the new buffer is entirely contained in the existing buffer, drop it entirely */
				to_add = false;
				break;
			}
		}
	}			
	if (to_add) {
		Log.d("MP4Box", "Appending new buffer (fileStart: "+ab.fileStart+" length:"+ab.byteLength+")");
		this.nextBuffers.push(ab);
		if (i === 0 && this.inputStream != null) {
			this.inputStream.buffer = ab;
		}
	}
}

MP4Box.prototype.open = function() {
	if (!this.inputStream) { /* We create the DataStream object only when we have the first bytes of the file */
		if (this.nextBuffers.length > 0) {
			var firstBuffer = this.nextBuffers[0];
			if (firstBuffer.fileStart === 0) {
				this.inputStream = new DataStream(firstBuffer, 0, DataStream.BIG_ENDIAN);	
				this.inputStream.nextBuffers = this.nextBuffers;
				this.inputStream.bufferIndex = 0;
			} else {
				Log.w("MP4Box", "The first buffer should have a fileStart of 0");
				return false;
			}
		} else {
			Log.w("MP4Box", "No buffer to start parsing from");
			return false;
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
	var i;
	var trak;
	/* For each track marked for fragmentation, 
	   check if the next sample is there (i.e. if the sample information is known (i.e. moof has arrived) and if it has been downloaded) 
	   and create a fragment with it */
	if (this.isFragmentationStarted && this.onSegment !== null) {
		for (i = 0; i < this.fragmentedTracks.length; i++) {
			var fragTrak = this.fragmentedTracks[i];
			trak = fragTrak.trak;
			while (trak.nextSample < trak.samples.length) {				
				/* The sample information is there (either because the file is not fragmented and this is not the last sample, 
				or because the file is fragmented and the moof for that sample has been received */
				Log.d("MP4Box", "Creating media fragment on track #"+fragTrak.id +" for sample "+trak.nextSample); 
				var result = this.createFragment(this.inputIsoFile, fragTrak.id, trak.nextSample, fragTrak.segmentStream);
				if (result) {
					fragTrak.segmentStream = result;
					trak.nextSample++;
				} else {
					/* The fragment could not be created because the media data is not there (not downloaded), wait for it */
					break;
				}
				/* A fragment is created by sample, but the segment is the accumulation in the buffer of these fragments.
				   It is flushed only as requested by the application (nb_samples) to avoid too many callbacks */
				if (trak.nextSample % fragTrak.nb_samples === 0 || trak.nextSample >= trak.samples.length) {
					Log.i("MP4Box", "Sending fragmented data on track #"+fragTrak.id+" for samples ["+(trak.nextSample-fragTrak.nb_samples)+","+(trak.nextSample-1)+"]"); 
					if (this.onSegment) {
						this.onSegment(fragTrak.id, fragTrak.user, fragTrak.segmentStream.buffer, trak.nextSample);
					}
					/* force the creation of a new buffer */
					fragTrak.segmentStream = null;
					if (fragTrak !== this.fragmentedTracks[i]) {
						/* make sure we can stop fragmentation if needed */
						break;
					}
				}
			}
		}
	}

	if (this.onSamples !== null) {
		/* For each track marked for data export, 
		   check if the next sample is there (i.e. has been downloaded) and send it */
		for (i = 0; i < this.extractedTracks.length; i++) {
			var extractTrak = this.extractedTracks[i];
			trak = extractTrak.trak;
			while (trak.nextSample < trak.samples.length) {				
				Log.i("MP4Box", "Exporting on track #"+extractTrak.id +" sample "+trak.nextSample); 			
				var sample = this.inputIsoFile.getSample(trak, trak.nextSample);
				if (sample) {
					trak.nextSample++;
					extractTrak.samples.push(sample);
				} else {
					return;
				}
				if (trak.nextSample % extractTrak.nb_samples === 0 || trak.nextSample >= trak.samples.length) {
					Log.i("MP4Box", "Sending samples on track #"+extractTrak.id+" for sample "+trak.nextSample); 
					if (this.onSamples) {
						this.onSamples(extractTrak.id, extractTrak.user, extractTrak.samples);
					}
					extractTrak.samples = [];
					if (extractTrak !== this.extractedTracks[i]) {
						/* check if the extraction needs to be stopped */
						break;
					}
				}
			}
		}
	}
}

MP4Box.prototype.appendBuffer = function(ab) {
	var is_open;
	if (ab === null || ab === undefined) {
		throw("Buffer must be defined and non empty");
	}	
	if (ab.fileStart === undefined) {
		throw("Buffer must have a fileStart property");
	}	
	if (ab.byteLength === 0) {
		Log.w("MP4Box", "Ignoring empty buffer");
		return;
	}
	/* mark the bytes in the buffer as not being used yet */
	ab.usedBytes = 0;
	this.insertBuffer(ab);
	is_open = this.open();
	if (is_open) {
		this.processSamples();
		
		/* Inform about the best range to fetch next */
		Log.i("MP4Box", "Next buffer to fetch should have a fileStart position of "+this.inputIsoFile.nextParsePosition);	
		return this.inputIsoFile.nextParsePosition;
	} else {
		if (this.inputIsoFile !== null) {
			/* moov has not been parsed but the first buffer was received, 
			   the next fetch should probably be the next box start */
			return this.inputIsoFile.nextParsePosition;
		} else {
			/* No valid buffer has been parsed yet, we cannot know what to parse next */
			return 0;
		}
	}	
}

MP4Box.prototype.getInfo = function() {
	var movie = {};
	var trak;
	var track;
	var sample_desc;
	var _1904 = (new Date(4, 0, 1, 0, 0, 0, 0).getTime());

	movie.duration = this.inputIsoFile.moov.mvhd.duration;
	movie.timescale = this.inputIsoFile.moov.mvhd.timescale;
	movie.isFragmented = (this.inputIsoFile.moov.mvex != null);
	if (movie.isFragmented && this.inputIsoFile.moov.mvex.mehd) {
		movie.fragment_duration = this.inputIsoFile.moov.mvex.mehd.fragment_duration;
	}
	movie.isProgressive = this.inputIsoFile.isProgressive;
	movie.hasIOD = (this.inputIsoFile.moov.iods != null);
	movie.brands = []; 
	movie.brands.push(this.inputIsoFile.ftyp.major_brand);
	movie.brands = movie.brands.concat(this.inputIsoFile.ftyp.compatible_brands);	
	movie.created = new Date(_1904+this.inputIsoFile.moov.mvhd.creation_time*1000);
	movie.modified = new Date(_1904+this.inputIsoFile.moov.mvhd.modification_time*1000);
	movie.tracks = [];
	movie.audioTracks = [];
	movie.videoTracks = [];
	movie.subtitleTracks = [];
	movie.metadataTracks = [];
	movie.hintTracks = [];
	movie.otherTracks = [];
	for (i = 0; i < this.inputIsoFile.moov.traks.length; i++) {
		trak = this.inputIsoFile.moov.traks[i];
		sample_desc = trak.mdia.minf.stbl.stsd.entries[0];
		track = {};
		movie.tracks.push(track);
		track.id = trak.tkhd.track_id;
		track.references = [];
		if (trak.tref) {
			for (j = 0; j < trak.tref.boxes.length; j++) {
				ref = {};
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
		track.size = 0;
		for (j = 0; j < track.nb_samples; j++) {
			track.size += trak.samples[j].size;
		}
		track.bitrate = (track.size*8*track.timescale)/track.duration;
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
		} else {
			movie.otherTracks.push(track);
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

MP4Box.prototype.writeFile = function() {
	var stream = new DataStream();
	stream.endianness = DataStream.BIG_ENDIAN;
	this.inputIsoFile.write(stream);
	return stream.buffer;
}

MP4Box.prototype.initializeSegmentation = function() {
	var i;
	var j;
	var box;
	var initSegs;
	var trak;
	if (this.onSegment === null) {
		Log.w("MP4Box", "No segmentation callback set!");
	}
	if (!this.isFragmentationStarted) {
		this.isFragmentationStarted = true;		
		this.nextMoofNumber = 0;
		this.inputIsoFile.resetTables();
	}	
	initSegs = [];
	for (i = 0; i < this.fragmentedTracks.length; i++) {
		/* removing all tracks to create initialization segments with only one track */
		for (j = 0; j < this.inputIsoFile.moov.boxes.length; j++) {
			box = this.inputIsoFile.moov.boxes[j];
			if (box && box.type === "trak") {
				this.inputIsoFile.moov.boxes[j].ignore = true;
				this.inputIsoFile.moov.boxes[j] = null;
			}
		}
		/* adding only the needed track */
		trak = this.inputIsoFile.getTrackById(this.fragmentedTracks[i].id);
		delete trak.ignore;
		for (j = 0; j < this.inputIsoFile.moov.boxes.length; j++) {
			box = this.inputIsoFile.moov.boxes[j];
			if (box == null) {
				this.inputIsoFile.moov.boxes[j] = trak;
				break;
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

MP4Box.prototype.seekTrack = function(time, useRap, trak) {
	var j;
	var sample;
	var rap_offset = Infinity;
	var rap_time = 0;
	var seek_offset = Infinity;
	var rap_seek_sample_num = 0;
	var seek_sample_num = 0;
	var timescale;
	for (j = 0; j < trak.samples.length; j++) {
		sample = trak.samples[j];
		if (useRap && sample.is_rap) {
			rap_offset = sample.offset;
			rap_time = sample.cts;
			rap_seek_sample_num = j;
		}
		if (j === 0) {
			seek_offset = sample.offset;
			seek_sample_num = 0;
			timescale = sample.timescale;
		} else if (sample.cts > time * sample.timescale) {
			seek_offset = trak.samples[j-1].offset;
			seek_sample_num = j-1;
			break;
		}
	}
	if (useRap) {
		trak.nextSample = rap_seek_sample_num;
		Log.i("MP4Box", "Seeking to RAP sample "+trak.nextSample+" on track "+trak.tkhd.track_id+", time "+Log.getDurationString(rap_time, timescale) +" and offset: "+rap_offset);
		return { offset: rap_offset, time: rap_time };
	} else {
		trak.nextSample = seek_sample_num;
		Log.i("MP4Box", "Seeking to sample "+trak.nextSample+" on track "+trak.tkhd.track_id+", time "+Log.getDurationString(time)+" and offset: "+rap_offset);
		return { offset: seek_offset, time: time };
	}
}

MP4Box.prototype.seek = function(time, useRap) {
	var moov = this.inputIsoFile.moov;
	var trak;
	var trak_seek_info;
	var i;
	var seek_info = { offset: Infinity, time: Infinity };
	if (!this.inputIsoFile.moov) {
		throw "Cannot seek: moov not received!";
	} else {
		for (i = 0; i<moov.traks.length; i++) {
			trak = moov.traks[i];			
			trak_seek_info = this.seekTrack(time, useRap, trak);
			if (trak_seek_info.offset < seek_info.offset) {
				seek_info.offset = trak_seek_info.offset;
			}
			if (trak_seek_info.time < seek_info.time) {
				seek_info.time = trak_seek_info.time;
			}
		}
		if (seek_info.offset === Infinity) {
			/* No sample info, in all tracks, cannot seek */
			return { offset: this.inputIsoFile.nextParsePosition, time: 0 };
		} else {
			this.inputIsoFile.nextSeekPosition = seek_info.offset;
			return seek_info;
		}
	}
}

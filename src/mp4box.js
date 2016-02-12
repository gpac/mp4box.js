/* 
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var MP4Box = function (_keepMdatData) {
	/* MultiBufferStream to parse chunked file data */
	this.inputStream = new MultiBufferStream();
	/* Boolean indicating if bytes containing media data should be kept in memory */
	this.keepMdatData = (_keepMdatData !== undefined ? _keepMdatData : true);
	/* ISOFile object containing the parsed boxes */
	this.inputIsoFile = new ISOFile(this.inputStream);
	this.inputIsoFile.discardMdatData = (this.keepMdatData ? false : true);
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
	/* Array of Track objects for which fragmentation of samples is requested */
	this.fragmentedTracks = [];
	/* Array of Track objects for which extraction of samples is requested */
	this.extractedTracks = [];
	/* Boolean indicating that fragmention is ready */
	this.isFragmentationInitialized = false;
	/* Boolean indicating that fragmented has started */
	this.sampleProcessingStarted = false;
	/* Number of the next 'moof' to generate when fragmenting */
	this.nextMoofNumber = 0;
	/* Boolean indicating if the initial list of items has been produced */
	this.itemListBuilt = false;
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
		sample = trak.samples[sampleNumber];
		if (this.nextSeekPosition) {
			this.nextSeekPosition = Math.min(sample.offset+sample.alreadyRead,this.nextSeekPosition);
		} else {
			this.nextSeekPosition = trak.samples[sampleNumber].offset+sample.alreadyRead;
		}
		return null;
	}
	
	var stream = stream_ || new DataStream();
	stream.endianness = DataStream.BIG_ENDIAN;

	var moof = this.createSingleSampleMoof(sample);
	moof.write(stream);

	/* adjusting the data_offset now that the moof size is known*/
	moof.trun.data_offset = moof.size+8; //8 is mdat header
	Log.debug("MP4Box", "Adjusting data_offset with new value "+moof.trun.data_offset);
	stream.adjustUint32(moof.trun.data_offset_position, moof.trun.data_offset);
		
	var mdat = new BoxParser.mdatBox();
	mdat.data = sample.data;
	mdat.write(stream);
	return stream;
}

MP4Box.prototype.processSamples = function() {
	var i;
	var trak;
	if (!this.sampleProcessingStarted) return;

	/* For each track marked for fragmentation, 
	   check if the next sample is there (i.e. if the sample information is known (i.e. moof has arrived) and if it has been downloaded) 
	   and create a fragment with it */
	if (this.isFragmentationInitialized && this.onSegment !== null) {
		for (i = 0; i < this.fragmentedTracks.length; i++) {
			var fragTrak = this.fragmentedTracks[i];
			trak = fragTrak.trak;
			while (trak.nextSample < trak.samples.length && this.sampleProcessingStarted) {				
				/* The sample information is there (either because the file is not fragmented and this is not the last sample, 
				or because the file is fragmented and the moof for that sample has been received */
				Log.debug("MP4Box", "Creating media fragment on track #"+fragTrak.id +" for sample "+trak.nextSample); 
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
					Log.info("MP4Box", "Sending fragmented data on track #"+fragTrak.id+" for samples ["+Math.max(0,trak.nextSample-fragTrak.nb_samples)+","+(trak.nextSample-1)+"]"); 
					Log.info("MP4Box", "Sample data size in memory: "+this.inputIsoFile.getAllocatedSampleDataSize()); 			
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
			while (trak.nextSample < trak.samples.length && this.sampleProcessingStarted) {				
				Log.debug("MP4Box", "Exporting on track #"+extractTrak.id +" sample #"+trak.nextSample);
				var sample = this.inputIsoFile.getSample(trak, trak.nextSample);
				if (sample) {
					trak.nextSample++;
					extractTrak.samples.push(sample);
				} else {
					break;
				}
				if (trak.nextSample % extractTrak.nb_samples === 0 || trak.nextSample >= trak.samples.length) {
					Log.debug("MP4Box", "Sending samples on track #"+extractTrak.id+" for sample "+trak.nextSample); 
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

MP4Box.prototype.checkBuffer = function (ab) {
	if (ab === null || ab === undefined) {
		throw("Buffer must be defined and non empty");
	}	
	if (ab.fileStart === undefined) {
		throw("Buffer must have a fileStart property");
	}	
	if (ab.byteLength === 0) {
		Log.warn("MP4Box", "Ignoring empty buffer (fileStart: "+ab.fileStart+")");
		this.inputStream.logBufferLevel();
		return false;
	}
	Log.info("MP4Box", "Processing buffer (fileStart: "+ab.fileStart+")");

	/* mark the bytes in the buffer as not being used yet */
	ab.usedBytes = 0;
	this.inputStream.insertBuffer(ab);
	this.inputStream.logBufferLevel();

	if (!this.inputStream.initialized()) {
		Log.warn("MP4Box", "Not ready to start parsing");
		return false;
	}
	return true;
}

/* Processes a new ArrayBuffer (with a fileStart property)
   Returns the next expected file position, or undefined if not ready to parse */
MP4Box.prototype.appendBuffer = function(ab) {
	var nextFileStart;
	if (this.checkBuffer) {
		if (!this.checkBuffer(ab)) {
			return;
		}
	}

	/* Parse whatever is in the existing buffers */
	this.inputIsoFile.parse();

	/* Check if the moovStart callback needs to be called */
	if (this.inputIsoFile.moovStartFound && !this.moovStartSent) {
		this.moovStartSent = true;
		if (this.onMoovStart) this.onMoovStart();
	}

	if (this.inputIsoFile.moov) {
		/* A moov box has been entirely parsed */
		
		if (this.processSamples) {
			/* if this is the first call after the moov is found we initialize the list of samples (may be empty in fragmented files) */
			if (!this.sampleListBuilt) {
				this.inputIsoFile.buildSampleLists();
				this.sampleListBuilt = true;
			} 

			/* We update the sample information if there are any new moof boxes */
			this.inputIsoFile.updateSampleLists();
		}
		
		/* If the application needs to be informed that the 'moov' has been found, 
		   we create the information object and callback the application */
		if (this.onReady && !this.readySent) {
			this.readySent = true;
			this.onReady(this.getInfo());
		}

		if (this.processSamples) {
			/* See if any sample extraction or segment creation needs to be done with the available samples */
			this.processSamples();
		}

		/* Inform about the best range to fetch next */
		if (this.nextSeekPosition) {
			nextFileStart = this.nextSeekPosition;
			this.nextSeekPosition = undefined;
		} else {
			nextFileStart = this.inputIsoFile.nextParsePosition;
		}		
		if (this.inputStream.getEndFilePositionAfter) {
			nextFileStart = this.inputStream.getEndFilePositionAfter(nextFileStart);
		}
	} else {
		if (this.inputIsoFile !== null) {
			/* moov has not been parsed but the first buffer was received, 
			   the next fetch should probably be the next box start */
			nextFileStart = this.inputIsoFile.nextParsePosition;
		} else {
			/* No valid buffer has been parsed yet, we cannot know what to parse next */
			nextFileStart = 0;
		}
	}	
	if (this.inputIsoFile.meta) {
		if (this.inputIsoFile.flattenItemInfo && !this.itemListBuilt) {
			this.inputIsoFile.flattenItemInfo();
			this.itemListBuilt = true;
		}
		if (this.inputIsoFile.processItems) {
			this.inputIsoFile.processItems(this.onItem);
		}
	}

	if (this.inputStream.cleanBuffers) {
		Log.info("MP4Box", "Done processing buffer (fileStart: "+ab.fileStart+") - next buffer to fetch should have a fileStart position of "+nextFileStart);
		this.inputStream.logBufferLevel();
		this.inputStream.cleanBuffers();
		this.inputStream.logBufferLevel(true);
		Log.info("MP4Box", "Sample data size in memory: "+this.inputIsoFile.getAllocatedSampleDataSize()); 			
	}
	return nextFileStart;
}

MP4Box.prototype.getInfo = function() {
	var i, j;
	var movie = {};
	var trak;
	var track;
	var sample_desc;
	var _1904 = (new Date(4, 0, 1, 0, 0, 0, 0).getTime());

	if (this.inputIsoFile.moov) {
		movie.hasMoov = true;
		movie.duration = this.inputIsoFile.moov.mvhd.duration;
		movie.timescale = this.inputIsoFile.moov.mvhd.timescale;
		movie.isFragmented = (this.inputIsoFile.moov.mvex != null);
		if (movie.isFragmented && this.inputIsoFile.moov.mvex.mehd) {
			movie.fragment_duration = this.inputIsoFile.moov.mvex.mehd.fragment_duration;
		} else {
			movie.fragment_duration = 0;
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
			track.kind = (trak.udta && trak.udta.kinds.length ? trak.udta.kinds[0] : { schemeURI: "", value: ""});
			track.language = (trak.mdia.elng ? trak.mdia.elng.extended_language : trak.mdia.mdhd.languageString);
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
	} else {
		movie.hasMoov = false;
	}
	return movie;
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
	var seg;
	if (this.onSegment === null) {
		Log.warn("MP4Box", "No segmentation callback set!");
	}
	if (!this.isFragmentationInitialized) {
		this.isFragmentationInitialized = true;		
		this.nextMoofNumber = 0;
		this.inputIsoFile.resetTables();
	}	
	initSegs = [];	
	for (i = 0; i < this.fragmentedTracks.length; i++) {
		var moov = new BoxParser.moovBox();
		moov.mvhd = this.inputIsoFile.moov.mvhd;
	    moov.boxes.push(moov.mvhd);
		trak = this.inputIsoFile.getTrackById(this.fragmentedTracks[i].id);
		moov.boxes.push(trak);
		moov.traks.push(trak);
		seg = {};
		seg.id = trak.tkhd.track_id;
		seg.user = this.fragmentedTracks[i].user;
		seg.buffer = ISOFile.writeInitializationSegment(moov, (this.inputIsoFile.moov.mvex && this.inputIsoFile.moov.mvex.mehd ? this.inputIsoFile.moov.mvex.mehd.fragment_duration: undefined), (this.inputIsoFile.moov.traks[i].samples.length>0 ? this.inputIsoFile.moov.traks[i].samples[0].duration: 0));
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
	Log.info("MP4Box", "Track #"+id+" released samples up to "+sampleNum+" (released size: "+size+", remaining: "+this.inputIsoFile.samplesDataSize+")");
	trak.lastValidSample = sampleNum;
}

/* Called by the application to flush the remaining samples, once the download is finished */
MP4Box.prototype.flush = function() {
	Log.info("MP4Box", "Flushing remaining samples");
	this.inputIsoFile.updateSampleLists();
	this.processSamples();
	this.inputStream.cleanBuffers();
	this.inputStream.logBufferLevel(true);
}

/* Finds the byte offset for a given time on a given track
   also returns the time of the previous rap */
MP4Box.prototype.seekTrack = function(time, useRap, trak) {
	var j;
	var sample;
	var seek_offset = Infinity;
	var rap_seek_sample_num = 0;
	var seek_sample_num = 0;
	var timescale;
	
	if (trak.samples.length === 0) {
		Log.info("MP4Box", "No sample in track, cannot seek! Using time "+Log.getDurationString(0, 1) +" and offset: "+0);
		return { offset: 0, time: 0 };
	} 

	for (j = 0; j < trak.samples.length; j++) {
		sample = trak.samples[j];
		if (j === 0) {
			seek_sample_num = 0;
			timescale = sample.timescale;
		} else if (sample.cts > time * sample.timescale) {
			seek_sample_num = j-1;
			break;
		} 
		if (useRap && sample.is_rap) {
			rap_seek_sample_num = j;
		}
	}
	if (useRap) {
		seek_sample_num = rap_seek_sample_num;
	}
	time = trak.samples[seek_sample_num].cts;
	trak.nextSample = seek_sample_num;
	while (trak.samples[seek_sample_num].alreadyRead === trak.samples[seek_sample_num].size) {
		seek_sample_num++;
	}
	seek_offset = trak.samples[seek_sample_num].offset+trak.samples[seek_sample_num].alreadyRead;
	Log.info("MP4Box", "Seeking to "+(useRap ? "RAP": "")+" sample #"+trak.nextSample+" on track "+trak.tkhd.track_id+", time "+Log.getDurationString(time, timescale) +" and offset: "+seek_offset);
	return { offset: seek_offset, time: time/timescale };
}

/* Finds the byte offset in the file corresponding to the given time or to the time of the previous RAP */
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
		Log.info("MP4Box", "Seeking at time "+Log.getDurationString(seek_info.time, 1)+" needs a buffer with a fileStart position of "+seek_info.offset);
		if (seek_info.offset === Infinity) {
			/* No sample info, in all tracks, cannot seek */
			seek_info = { offset: this.inputIsoFile.nextParsePosition, time: 0 };
		} else {
			/* check if the seek position is already in some buffer and
			 in that case return the end of that buffer (or of the last contiguous buffer) */
			/* TODO: Should wait until append operations are done */
			seek_info.offset = this.inputStream.getEndFilePositionAfter(seek_info.offset);
		}
		Log.info("MP4Box", "Adjusted seek position (after checking data already in buffer): "+seek_info.offset);
		return seek_info;
	}
}

MP4Box.prototype.getTrackSamplesInfo = function(track_id) {
	var track = this.inputIsoFile.getTrackById(track_id);
	if (track) {
		return track.samples;
	} else {
		return;
	}
}

MP4Box.prototype.getTrackSample = function(track_id, number) {
	var track = this.inputIsoFile.getTrackById(track_id);
	var sample = this.inputIsoFile.getSample(track, number);
	return sample;	
}

MP4Box.prototype.start = function() {
	this.sampleProcessingStarted = true;
	this.processSamples();
}

MP4Box.prototype.stop = function() {
	this.sampleProcessingStarted = false;
}

if (typeof exports !== 'undefined') {
	exports.MP4Box = MP4Box;	
}

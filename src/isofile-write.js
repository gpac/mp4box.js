/* Rewrite the entire file */
ISOFile.prototype.write = function(outstream) {
	for (var i=0; i<this.boxes.length; i++) {
		this.boxes[i].write(outstream);
	}
}

ISOFile.prototype.createFragment = function(track_id, sampleNumber, stream_) {
	var trak = this.getTrackById(track_id);
	var sample = this.getSample(trak, sampleNumber);
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
	moof.trafs[0].truns[0].data_offset = moof.size+8; //8 is mdat header
	Log.debug("MP4Box", "Adjusting data_offset with new value "+moof.trafs[0].truns[0].data_offset);
	stream.adjustUint32(moof.trafs[0].truns[0].data_offset_position, moof.trafs[0].truns[0].data_offset);
		
	var mdat = new BoxParser.mdatBox();
	mdat.data = sample.data;
	mdat.write(stream);
	return stream;
}

/* Modify the file and create the initialization segment */
ISOFile.writeInitializationSegment = function(ftyp, moov, total_duration, sample_duration) {
	var i;
	var index;
	var mehd;
	var trex;
	var box;
	Log.debug("ISOFile", "Generating initialization segment");

	var stream = new DataStream();
	stream.endianness = DataStream.BIG_ENDIAN;
	ftyp.write(stream);
	
	/* we can now create the new mvex box */
	var mvex = moov.add("mvex");
	if (total_duration) {
		mvex.add("mehd").set("fragment_duration", total_duration);
	}
	for (i = 0; i < moov.traks.length; i++) {
		mvex.add("trex").set("track_id", moov.traks[i].tkhd.track_id)
						.set("default_sample_description_index", 1)
						.set("default_sample_duration", sample_duration)
						.set("default_sample_size", 0)
						.set("default_sample_flags", 1<<16)
	}
	moov.write(stream);

	return stream.buffer;

}

ISOFile.prototype.save = function(name) {
	var stream = new DataStream();
	stream.endianness = DataStream.BIG_ENDIAN;
	this.write(stream);
	stream.save(name);	
}

ISOFile.prototype.getBuffer = function() {
	var stream = new DataStream();
	stream.endianness = DataStream.BIG_ENDIAN;
	this.write(stream);
	return stream.buffer;
}

ISOFile.prototype.initializeSegmentation = function() {
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
		this.resetTables();
	}	
	initSegs = [];	
	for (i = 0; i < this.fragmentedTracks.length; i++) {
		var moov = new BoxParser.moovBox();
		moov.mvhd = this.moov.mvhd;
	    moov.boxes.push(moov.mvhd);
		trak = this.getTrackById(this.fragmentedTracks[i].id);
		moov.boxes.push(trak);
		moov.traks.push(trak);
		seg = {};
		seg.id = trak.tkhd.track_id;
		seg.user = this.fragmentedTracks[i].user;
		seg.buffer = ISOFile.writeInitializationSegment(this.ftyp, moov, (this.moov.mvex && this.moov.mvex.mehd ? this.moov.mvex.mehd.fragment_duration: undefined), (this.moov.traks[i].samples.length>0 ? this.moov.traks[i].samples[0].duration: 0));
		initSegs.push(seg);
	}
	return initSegs;
}


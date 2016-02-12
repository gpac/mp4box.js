/* Rewrite the entire file */
ISOFile.prototype.write = function(outstream) {
	for (var i=0; i<this.boxes.length; i++) {
		this.boxes[i].write(outstream);
	}
}

/* Modify the file and create the initialization segment */
ISOFile.writeInitializationSegment = function(moov, total_duration, sample_duration) {
	var i;
	var index;
	var mehd;
	var trex;
	var box;
	Log.debug("ISOFile", "Generating initialization segment");

	var stream = new DataStream();
	stream.endianness = DataStream.BIG_ENDIAN;

	/* we can now create the new mvex box */
	moov.mvex = new BoxParser.mvexBox();
	moov.boxes.push(moov.mvex);
	if (total_duration) {
		moov.mvex.mehd = new BoxParser.mehdBox();
		moov.mvex.boxes.push(moov.mvex.mehd);
		moov.mvex.mehd.fragment_duration = total_duration; 
	}
	for (i = 0; i < moov.traks.length; i++) {
		trex = new BoxParser.trexBox();
		moov.mvex.boxes.push(trex);
		moov.mvex.trexs.push(trex);
		trex.track_id = moov.traks[i].tkhd.track_id;
		trex.default_sample_description_index = 1;
		trex.default_sample_duration = sample_duration;
		trex.default_sample_size = 0;
		trex.default_sample_flags = 1<<16;
	}
	moov.write(stream);

	return stream.buffer;

}

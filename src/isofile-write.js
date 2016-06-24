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

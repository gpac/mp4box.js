BoxParser.createFullBoxCtor("mfhd", "MovieFragmentHeaderBox", function(stream) {
	this.sequence_number = stream.readUint32();
});


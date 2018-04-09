BoxParser.createFullBoxCtor("mfhd", function(stream) {
	this.sequence_number = stream.readUint32();
});


BoxParser.createFullBoxCtor("smhd", "SoundMediaHeaderBox", function(stream) {
	this.balance = stream.readUint16();
	stream.readUint16();
});


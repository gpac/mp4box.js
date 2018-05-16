BoxParser.createFullBoxCtor("smhd", function(stream) {
	this.balance = stream.readUint16();
	stream.readUint16();
});


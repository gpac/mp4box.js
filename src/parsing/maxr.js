BoxParser.createBoxCtor("maxr", function(stream) {
	this.period = stream.readUint32();
	this.bytes = stream.readUint32();
});


BoxParser.createBoxCtor("dimm", function(stream) {
	this.bytessent = stream.readUint64();
});


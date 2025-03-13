BoxParser.createBoxCtor("tpyl", "hintBytesSent", function(stream) {
	this.bytessent = stream.readUint64();
});


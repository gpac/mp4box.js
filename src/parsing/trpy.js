BoxParser.createBoxCtor("trpy", "hintBytesSent", function(stream) {
	this.bytessent = stream.readUint64();
});


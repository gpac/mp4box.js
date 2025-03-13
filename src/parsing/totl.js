BoxParser.createBoxCtor("totl", "hintBytesSent", function(stream) {
	this.bytessent = stream.readUint32();
});


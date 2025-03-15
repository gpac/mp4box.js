BoxParser.createBoxCtor("dmed", "hintmediaBytesSent", function(stream) {
	this.bytessent = stream.readUint64();
});


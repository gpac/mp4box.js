BoxParser.createBoxCtor("drep", "hintrepeatedBytesSent", function(stream) {
	this.bytessent = stream.readUint64();
});


BoxParser.createBoxCtor("dimm", "hintimmediateBytesSent", function(stream) {
	this.bytessent = stream.readUint64();
});


BoxParser.createBoxCtor("tpay", "hintBytesSent", function(stream) {
	this.bytessent = stream.readUint32();
});


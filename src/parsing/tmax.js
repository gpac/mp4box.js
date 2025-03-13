BoxParser.createBoxCtor("tmax", "hintmaxrelativetime", function(stream) {
	this.time = stream.readUint32();
});


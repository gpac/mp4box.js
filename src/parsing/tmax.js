BoxParser.createBoxCtor("tmax", function(stream) {
	this.time = stream.readUint32();
});


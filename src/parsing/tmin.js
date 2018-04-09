BoxParser.createBoxCtor("tmin", function(stream) {
	this.time = stream.readUint32();
});


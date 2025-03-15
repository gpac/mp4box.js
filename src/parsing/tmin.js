BoxParser.createBoxCtor("tmin", "hintminrelativetime", function(stream) {
	this.time = stream.readUint32();
});


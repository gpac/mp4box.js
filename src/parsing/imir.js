BoxParser.createBoxCtor("imir", "ImageMirror", function(stream) {
	var tmp = stream.readUint8();
	this.reserved = tmp >> 7;
	this.axis = tmp & 1;
});
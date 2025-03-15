BoxParser.createBoxCtor("irot", "ImageRotation", function(stream) {
	this.angle = stream.readUint8() & 0x3;
});


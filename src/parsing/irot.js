BoxParser.createBoxCtor("irot", function(stream) {
	this.angle = stream.readUint8() & 0x3;
});


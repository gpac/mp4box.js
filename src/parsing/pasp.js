BoxParser.createBoxCtor("pasp", "PixelAspectRatioBox", function(stream) {
	this.hSpacing = stream.readUint32();
	this.vSpacing = stream.readUint32();
});
BoxParser.createFullBoxCtor("ispe", function(stream) {
	this.image_width = stream.readUint32();
	this.image_height = stream.readUint32();
});
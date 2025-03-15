BoxParser.createFullBoxCtor("ispe", "ImageSpatialExtentsProperty", function(stream) {
	this.image_width = stream.readUint32();
	this.image_height = stream.readUint32();
});
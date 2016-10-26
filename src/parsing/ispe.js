BoxParser.ispeBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.image_width = stream.readUint32();
	this.image_height = stream.readUint32();
}
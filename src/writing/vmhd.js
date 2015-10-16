BoxParser.vmhdBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 0;
	this.size = 8;
	this.writeHeader(stream);
	stream.writeUint16(this.graphicsmode);
	stream.writeUint16Array(this.opcolor);
}


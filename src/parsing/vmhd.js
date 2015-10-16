BoxParser.vmhdBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.graphicsmode = stream.readUint16();
	this.opcolor = stream.readUint16Array(3);
}


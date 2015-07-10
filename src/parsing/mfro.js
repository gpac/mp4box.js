BoxParser.mfroBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.size = stream.readUint32();
}


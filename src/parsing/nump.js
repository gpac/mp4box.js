BoxParser.numpBox.prototype.parse = function(stream) {
	this.packetssent = stream.readUint64();
}


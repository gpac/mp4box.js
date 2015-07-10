BoxParser.maxrBox.prototype.parse = function(stream) {
	this.period = stream.readUint32();
	this.bytes = stream.readUint32();
}


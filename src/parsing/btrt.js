BoxParser.btrtBox.prototype.parse = function(stream) {
	this.bufferSizeDB = stream.readUint32();
	this.maxBitrate = stream.readUint32();
	this.avgBitrate = stream.readUint32();
}


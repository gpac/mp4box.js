BoxParser.mfhdBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.sequence_number = stream.readUint32();
}


BoxParser.mfroBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this._size = stream.readUint32();
}


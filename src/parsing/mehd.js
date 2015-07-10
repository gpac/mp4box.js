BoxParser.mehdBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.version == 1) {
		this.fragment_duration = stream.readUint64();
	} else {
		this.fragment_duration = stream.readUint32();
	}
}


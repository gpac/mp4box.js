BoxParser.padbBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	var sample_count = stream.readUint32();
	this.padbits = [];
	for (var i = 0; i < Math.floor((sample_count+1)/2); i++) {
		this.padbits = stream.readUint8();
	}
}


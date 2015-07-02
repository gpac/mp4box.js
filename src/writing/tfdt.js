BoxParser.tfdtBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 4;
	if (this.version === 1) {
		this.size += 4;
	}
	this.writeHeader(stream);
	if (this.version === 1) {
		stream.writeUint64(this.baseMediaDecodeTime);
	} else {
		stream.writeUint32(this.baseMediaDecodeTime); 
	}
}


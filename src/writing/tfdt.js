BoxParser.tfdtBox.prototype.write = function(stream) {
	var UINT32_MAX = Math.pow(2, 32) - 1;
	// use version 1 if baseMediaDecodeTime does not fit 32 bits
	this.version = this.baseMediaDecodeTime > UINT32_MAX ? 1 : 0;
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


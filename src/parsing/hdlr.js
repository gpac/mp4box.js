BoxParser.hdlrBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.version === 0) {
		this.componentType = stream.readString(4);
		this.componentSubType = stream.readString(4);
		stream.readUint32Array(3);
		this.name = stream.readString(this.size-this.hdr_size-20);
	} else {
		this.data = stream.readUint8Array(this.size-this.hdr_size);
	}
}


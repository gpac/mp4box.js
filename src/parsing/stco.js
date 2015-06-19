BoxParser.stcoBox.prototype.parse = function(stream) {
	var entry_count;
	this.parseFullHeader(stream);
	entry_count = stream.readUint32();
	if (this.version === 0) {
		this.chunk_offsets = stream.readUint32Array(entry_count);
	} else {
		this.data = stream.readUint8Array(this.size-this.hdr_size-4);
	}
}


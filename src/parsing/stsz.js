BoxParser.stszBox.prototype.parse = function(stream) {
	var i;
	var sample_size;
	var sample_count;
	this.parseFullHeader(stream);
	this.sample_sizes = [];
	if (this.version === 0) {
		sample_size = stream.readUint32();
		sample_count = stream.readUint32();
		if (sample_size === 0) {
			this.sample_sizes = stream.readUint32Array(sample_count);
		} else {
			for (i = 0; i < sample_count; i++) {
				this.sample_sizes[i] = sample_size;
			}		
		}
	} else {
		this.data = stream.readUint8Array(this.size-this.hdr_size);
	}
}


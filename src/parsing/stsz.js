BoxParser.createFullBoxCtor("stsz", function(stream) {
	var i;
	this.sample_sizes = [];
	if (this.version === 0) {
		this.sample_size = stream.readUint32();
		this.sample_count = stream.readUint32();
		if (this.sample_size === 0) {
			this.sample_sizes = stream.readUint32Array(this.sample_count);
		} else {
			for (i = 0; i < this.sample_count; i++) {
				this.sample_sizes[i] = this.sample_size;
			}
		}
	}
});


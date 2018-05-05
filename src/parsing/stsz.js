BoxParser.createFullBoxCtor("stsz", function(stream) {
	var i;
	this.sample_sizes = [];
	if (this.version === 0) {
		this.sample_size = stream.readUint32();
		this.sample_count = stream.readUint32();
		for (i = 0; i < this.sample_count; i++) {
			if (this.sample_size === 0) {
				this.sample_sizes.push(stream.readUint32());
			} else {
				this.sample_sizes[i] = this.sample_size;
			}
		}
	}
});


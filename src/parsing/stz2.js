BoxParser.createFullBoxCtor("stz2", function(stream) {
	var i;
	var sample_size;
	var sample_count;
	this.sample_sizes = [];
	if (this.version === 0) {
		this.reserved = stream.readUint24();
		this.field_size = stream.readUint8();
		sample_count = stream.readUint32();
		if (this.field_size === 4) {
			for (i = 0; i < sample_count; i+=2) {
				var tmp = stream.readUint8();
				this.sample_sizes[i] = (tmp >> 4) & 0xF;
				this.sample_sizes[i+1] = tmp & 0xF;
			}
		} else if (this.field_size === 8) {
			for (i = 0; i < sample_count; i++) {
				this.sample_sizes[i] = stream.readUint8();
			}
		} else if (this.field_size === 16) {
			for (i = 0; i < sample_count; i++) {
				this.sample_sizes[i] = stream.readUint16();
			}
		} else {
			Log.error("BoxParser", "Error in length field in stz2 box");
		}
	}
});


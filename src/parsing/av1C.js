BoxParser.createBoxCtor("av1C", function(stream) {
	var i;
	var toparse;
	var tmp = stream.readUint8();
	if ((tmp >> 7) & 0x1 !== 1) {
		Log.error("av1C marker problem");
		return;
	}
	this.version = tmp & 0x7F;
	if (this.version !== 1) {
		Log.error("av1C version "+this.version+" not supported");
		return;
	}
	tmp = stream.readUint8();
	this.seq_profile = (tmp >> 5) & 0x7;
	this.seq_level_idx_0 = tmp & 0x1F;
	tmp = stream.readUint8();
	this.seq_tier_0 = (tmp >> 7) & 0x1;
	this.high_bitdepth = (tmp >> 6) & 0x1;
	this.twelve_bit = (tmp >> 5) & 0x1;
	this.monochrome = (tmp >> 4) & 0x1;
	this.chroma_subsampling_x = (tmp >> 3) & 0x1;
	this.chroma_subsampling_y = (tmp >> 2) & 0x1;
	this.chroma_sample_position = (tmp & 0x3);
	tmp = stream.readUint8();
	this.reserved_1 = (tmp >> 5) & 0x7;
	if (this.reserved_1 !== 0) {
		Log.error("av1C reserved_1 parsing problem");
		return;
	}
	this.initial_presentation_delay_present = (tmp >> 4) & 0x1;
	if (this.initial_presentation_delay_present === 1) {
		this.initial_presentation_delay_minus_one = (tmp & 0xF);
	} else {
		this.reserved_2 = (tmp & 0xF);
		if (this.reserved_2 !== 0) {
			Log.error("av1C reserved_2 parsing problem");
			return;
		}
	}

	var configOBUs_length = this.size - this.hdr_size - 4;
	this.configOBUs = stream.readUint8Array(configOBUs_length);
});


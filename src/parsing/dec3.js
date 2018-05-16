BoxParser.createBoxCtor("dec3", function(stream) {
	var tmp_16 = stream.readUint16();
	this.data_rate = tmp_16 >> 3;
	this.num_ind_sub = tmp_16 & 0x7;
	this.ind_subs = [];
	for (var i = 0; i < this.num_ind_sub+1; i++) {
		var ind_sub = {};
		this.ind_subs.push(ind_sub);
		var tmp_byte1 = stream.readUint8();
		var tmp_byte2 = stream.readUint8();
		var tmp_byte3 = stream.readUint8();
		ind_sub.fscod = tmp_byte1 >> 6;
		ind_sub.bsid  = ((tmp_byte1 >> 1) & 0x1F);
		ind_sub.bsmod = ((tmp_byte1 & 0x1) << 4) | ((tmp_byte2 >> 4) & 0xF);
		ind_sub.acmod = ((tmp_byte2 >> 1) & 0x7);
		ind_sub.lfeon = (tmp_byte2 & 0x1);
		ind_sub.num_dep_sub = ((tmp_byte3 >> 1) & 0xF);
		if (ind_sub.num_dep_sub > 0) {
			ind_sub.chan_loc = ((tmp_byte3 & 0x1) << 8) | stream.readUint8();
		}
	}
});


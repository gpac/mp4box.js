BoxParser.createBoxCtor("dac3", function(stream) {
	var tmp_byte1 = stream.readUint8();
	var tmp_byte2 = stream.readUint8();
	var tmp_byte3 = stream.readUint8();
	this.fscod = tmp_byte1 >> 6;
	this.bsid  = ((tmp_byte1 >> 1) & 0x1F);
	this.bsmod = ((tmp_byte1 & 0x1) <<  2) | ((tmp_byte2 >> 6) & 0x3);
	this.acmod = ((tmp_byte2 >> 3) & 0x7);
	this.lfeon = ((tmp_byte2 >> 2) & 0x1);
	this.bit_rate_code = (tmp_byte2 & 0x3) | ((tmp_byte3 >> 5) & 0x7);
});


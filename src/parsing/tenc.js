BoxParser.createFullBoxCtor("tenc", function(stream) {
	stream.readUint8(); // reserved
	if (this.version === 0) {
		stream.readUint8();
	} else {
		var tmp = stream.readUint8();
		this.default_crypt_byte_block = (tmp >> 4) & 0xF;
		this.default_skip_byte_block = tmp & 0xF;
	}
	this.default_isProtected = stream.readUint8();
	this.default_Per_Sample_IV_Size = stream.readUint8();
	this.default_KID = BoxParser.parseHex16(stream);
	if (this.default_isProtected === 1 && this.default_Per_Sample_IV_Size === 0) {
		this.default_constant_IV_size = stream.readUint8();
		this.default_constant_IV = stream.readUint8Array(this.default_constant_IV_size);
	}
});
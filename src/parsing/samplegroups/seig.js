var BoxParser = require('../../box.js').BoxParser;

BoxParser.seigSampleGroupEntry.prototype.parse = function(stream) {
	this.reserved = stream.readUint8();
	var tmp = stream.readUint8();
	this.crypt_byte_block = tmp >> 4;
	this.skip_byte_block = tmp & 0xF;
	this.isProtected = stream.readUint8();
	this.Per_Sample_IV_Size = stream.readUint8();
	this.KID = stream.readUint8Array(16);
	this.constant_IV_size = 0;
	this.constant_IV = 0;
	if (this.isProtected === 1 && this.Per_Sample_IV_Size === 0) {
		this.constant_IV_size = stream.readUint8();
		this.constant_IV = stream.readUint8Array(this.constant_IV_size);
	} 
}


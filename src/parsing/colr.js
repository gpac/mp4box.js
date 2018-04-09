BoxParser.createBoxCtor("colr", function(stream) {
	this.colour_type = stream.readString(4);
	if (this.colour_type === 'nclx') {
		this.colour_primaries = stream.readUint16();
		this.transfer_characteristics = stream.readUint16();
		this.matrix_coefficients = stream.readUint16();
		var tmp = stream.readUint8();
		this.full_range_flag = tmp >> 7;
	} else if (this.colour_type === 'rICC') {
		this.ICC_profile = stream.readUint8Array(this.size - 4);
	} else if (this.colour_type === 'prof') {
		this.ICC_profile = stream.readUint8Array(this.size - 4);
	}
});
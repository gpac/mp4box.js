BoxParser["rap SampleGroupEntry"].prototype.parse = function(stream) {
	var tmp_byte = stream.readUint8();
	this.num_leading_samples_known = tmp_byte >> 7;
	this.num_leading_samples = tmp_byte & 0x7F;
}


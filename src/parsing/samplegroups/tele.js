BoxParser.teleSampleGroupEntry.prototype.parse = function(stream) {
	var tmp_byte = stream.readUint8();
	this.level_independently_decodable = tmp_byte >> 7;
}


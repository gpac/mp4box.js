BoxParser.createBoxCtor("av3c", function(stream) {
	var i;
	var tmp_byte, sequnce_header_length;

	this.configurationVersion = stream.readUint8();
	sequnce_header_length = stream.readUint16();

	tmp_byte = stream.readUint32();   // video_sequence_start_code
	this.profile_id = stream.readUint8();
	this.level_id = stream.readUint8();

	// remaining sequence_header
	for (i=0; i<sequnce_header_length-6; i++) {
		tmp_byte=stream.readUint8();
	}
	tmp_byte=stream.readUint8();
	this.library_dependency_idc = (tmp_byte & 0x2 ? '1': -'0') + (tmp_byte & 0x1 ? '1': -'0');
});


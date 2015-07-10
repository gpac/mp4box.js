MP4Box.prototype.writeBPG = function(pixel_format, bit_depth_luma_minus8, bit_depth_chroma_minus8, width, height, data) {
	if (bit_depth_luma_minus8 !== bit_depth_chroma_minus8) {
		throw "Luma and chroma depths should be the same";
	}
	var stream = new DataStream();
	stream.endianness = DataStream.BIG_ENDIAN;
	
	stream.writeUint32(0x425047fb); /* file magic */
	
	var alpha1_flag = 0;
	stream.writeUint8(pixel_format<<5 | alpha1_flag << 4 | bit_depth);

	var color_space = 0;
	var extension_present_flag = 0;
	var alpha2_flag = 0;
	var limited_range_flag = 0;
	var animation_flag = 0;
	stream.writeUint8(color_space<<4 | extension_present_flag << 3 | alpha2_flag << 2 | limited_range_flag << 1 | animation_flag);

	stream.writeUint32(width);
	stream.writeUint32(height);

	stream.writeUint32(data.byteLength);
	if (extension_present_flag !== 0) {
		/* TODO: write extension_data_length and extension_data */
	}

	if (alpha1_flag || alpha2_flag) {
		/* write extra header */
	}
	stream.writeUint32(hevc_header_length);


	return stream.buffer;
}


BoxParser.createBoxCtor("lhvC", function(stream) {
	var i, j;
	var tmp_byte;
	this.configurationVersion = stream.readUint8();
	this.min_spatial_segmentation_idc = stream.readUint16() & 0xFFF;
	this.parallelismType = (stream.readUint8() & 0x3);
	tmp_byte = stream.readUint8();
	this.numTemporalLayers = (tmp_byte & 0XD) >> 3;
	this.temporalIdNested = (tmp_byte & 0X4) >> 2;
	this.lengthSizeMinusOne = (tmp_byte & 0X3);

	this.nalu_arrays = [];
	var numOfArrays = stream.readUint8();
	for (i = 0; i < numOfArrays; i++) {
		var nalu_array = [];
		this.nalu_arrays.push(nalu_array);
		tmp_byte = stream.readUint8()
		nalu_array.completeness = (tmp_byte & 0x80) >> 7;
		nalu_array.nalu_type = tmp_byte & 0x3F;
		var numNalus = stream.readUint16();
		for (j = 0; j < numNalus; j++) {
			var nalu = {}
			nalu_array.push(nalu);
			var length = stream.readUint16();
			nalu.data  = stream.readUint8Array(length);
		}
	}
});


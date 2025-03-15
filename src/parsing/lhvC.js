BoxParser.createBoxCtor("lhvC", "LHEVCConfigurationBox", function(stream) {
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
	this.nalu_arrays.toString = function () {
		var str = "<table class='inner-table'>";
		str += "<thead><tr><th>completeness</th><th>nalu_type</th><th>nalu_data</th></tr></thead>";
		str += "<tbody>";

		for (var i=0; i<this.length; i++) {
			var nalu_array = this[i];
			str += "<tr>";
			str += "<td rowspan='"+nalu_array.length+"'>"+nalu_array.completeness+"</td>";
			str += "<td rowspan='"+nalu_array.length+"'>"+nalu_array.nalu_type+"</td>";
			for (var j=0; j<nalu_array.length; j++) {
				var nalu = nalu_array[j];
				if (j !== 0) str += "<tr>";
				str += "<td>";
				str += nalu.data.reduce(function(str, byte) {
					return str + byte.toString(16).padStart(2, "0");
				}, "0x");
				str += "</td></tr>";
			}
		}
		str += "</tbody></table>";
		return str;
	}
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


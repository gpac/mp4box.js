function printPS(ps) {
	var str = "<table class='inner-table'>";
	str += "<thead><tr><th>length</th><th>nalu_data</th></tr></thead>";
	str += "<tbody>";

	for (var i=0; i < ps.length; i++) {
		var nalu = ps[i];
		str += "<tr>";
		str += "<td>"+nalu.length+"</td>";
		str += "<td>";
		str += nalu.nalu.reduce(function(str, byte) {
			return str + byte.toString(16).padStart(2, "0");
		}, "0x");
		str += "</td></tr>";
	}
	str += "</tbody></table>";
	return str;
}

BoxParser.createBoxCtor("avcC", "AVCConfigurationBox", function(stream) {
	var i;
	var toparse;
	this.configurationVersion = stream.readUint8();
	this.AVCProfileIndication = stream.readUint8();
	this.profile_compatibility = stream.readUint8();
	this.AVCLevelIndication = stream.readUint8();
	this.lengthSizeMinusOne = (stream.readUint8() & 0x3);
	this.nb_SPS_nalus = (stream.readUint8() & 0x1F);
	toparse = this.size - this.hdr_size - 6;
	this.SPS = [];
	this.SPS.toString = function () {
		return printPS(this);
	}
	for (i = 0; i < this.nb_SPS_nalus; i++) {
		this.SPS[i] = {};
		this.SPS[i].length = stream.readUint16();
		this.SPS[i].nalu = stream.readUint8Array(this.SPS[i].length);
		toparse -= 2+this.SPS[i].length;
	}
	this.nb_PPS_nalus = stream.readUint8();
	toparse--;
	this.PPS = [];
	this.PPS.toString = function () {
		return printPS(this);
	}
	for (i = 0; i < this.nb_PPS_nalus; i++) {
		this.PPS[i] = {};
		this.PPS[i].length = stream.readUint16();
		this.PPS[i].nalu = stream.readUint8Array(this.PPS[i].length);
		toparse -= 2+this.PPS[i].length;
	}
	if (toparse>0) {
		this.ext = stream.readUint8Array(toparse);
	}
});


BoxParser.createBoxCtor("avcC", function(stream) {
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
	for (i = 0; i < this.nb_SPS_nalus; i++) {
		this.SPS[i] = {};
		this.SPS[i].length = stream.readUint16();
		this.SPS[i].nalu = stream.readUint8Array(this.SPS[i].length);
		toparse -= 2+this.SPS[i].length;
	}
	this.nb_PPS_nalus = stream.readUint8();
	toparse--;
	this.PPS = [];
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


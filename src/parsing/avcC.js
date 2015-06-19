BoxParser.avcCBox.prototype.parse = function(stream) {
	var i;
	var nb_nalus;
	var length;
	var toparse;
	this.configurationVersion = stream.readUint8();
	this.AVCProfileIndication = stream.readUint8();
	this.profile_compatibility = stream.readUint8();
	this.AVCLevelIndication = stream.readUint8();
	this.lengthSizeMinusOne = (stream.readUint8() & 0x3);
	nb_nalus = (stream.readUint8() & 0x1F);
	toparse = this.size - this.hdr_size - 6;
	this.SPS = new Array(nb_nalus); 
	for (i = 0; i < nb_nalus; i++) {
		length = stream.readUint16();
		this.SPS[i] = stream.readUint8Array(length);
		toparse -= 2+length;
	}
	nb_nalus = stream.readUint8();
	toparse--;
	this.PPS = new Array(nb_nalus); 
	for (i = 0; i < nb_nalus; i++) {
		length = stream.readUint16();
		this.PPS[i] = stream.readUint8Array(length);
		toparse -= 2+length;
	}
	if (toparse>0) {
		this.ext = stream.readUint8Array(toparse);
	}
}


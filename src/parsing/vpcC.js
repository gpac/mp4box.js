BoxParser.createFullBoxCtor("vpcC", function (stream) {
	var tmp;
	if (this.version === 1) {
		this.profile = stream.readUint8();
		this.level = stream.readUint8();
		tmp = stream.readUint8();
		this.bitDepth = tmp >> 4;
		this.chromaSubsampling = (tmp >> 1) & 0x7;
		this.videoFullRangeFlag = tmp & 0x1;
		this.colourPrimaries = stream.readUint8();
		this.transferCharacteristics = stream.readUint8();
		this.matrixCoefficients = stream.readUint8();
		this.codecIntializationDataSize = stream.readUint16();
		this.codecIntializationData = stream.readUint8Array(this.codecIntializationDataSize);
	} else {
		this.profile = stream.readUint8();
		this.level = stream.readUint8();
		tmp = stream.readUint8();
		this.bitDepth = (tmp >> 4) & 0xF;
		this.colorSpace = tmp & 0xF;
		tmp = stream.readUint8();
		this.chromaSubsampling = (tmp >> 4) & 0xF;
		this.transferFunction = (tmp >> 1) & 0x7;
		this.videoFullRangeFlag = tmp & 0x1;
		this.codecIntializationDataSize = stream.readUint16();
		this.codecIntializationData = stream.readUint8Array(this.codecIntializationDataSize);
	}
});
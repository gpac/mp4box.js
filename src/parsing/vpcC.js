BoxParser.vpcCBox.prototype.parse = function (stream) {
	this.parseFullHeader(stream);
	this.profile = stream.readUint8();
	this.level = stream.readUint8();
	var tmp = stream.readUint8();
	this.bitDepth = (tmp >> 4) & 0xF;
	this.colorSpace = tmp & 0xF;
	tmp = stream.readUint8();
	this.chromaSubsampling = (tmp >> 4) & 0xF;
	this.transferFunction = (tmp >> 1) & 0x7;
	this.videoFullRangeFlag = tmp & 0x1;
	var codecIntializationDataSize = stream.readUint16();
	this.codecIntializationData = stream.readUint8Array(codecIntializationDataSize);
}
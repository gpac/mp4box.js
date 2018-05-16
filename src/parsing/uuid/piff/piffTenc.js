BoxParser.createUUIDBox("8974dbce7be74c5184f97148f9882554", true, false, function(stream) {
	this.default_AlgorithmID = stream.readUint24();
	this.default_IV_size = stream.readUint8();
	this.default_KID = BoxParser.parseHex16(stream);
});
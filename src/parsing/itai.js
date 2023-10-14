BoxParser.createFullBoxCtor("itai", function(stream) {
	this.TAI_timestamp = stream.readUint64();
	this.status_bits = stream.readUint8();
});
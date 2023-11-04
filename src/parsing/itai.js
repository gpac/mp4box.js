BoxParser.createFullBoxCtor("itai", function(stream) {
	this.TAI_timestamp = stream.readUint64();
	this.status_bits = stream.readUint8();

	if (this.TAI_timestamp === 0xffffffffffffffff) {
		this.TAI_timestamp = "unknown";
	}
});
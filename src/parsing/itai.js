BoxParser.createFullBoxCtor("itai", "TAITimestampBox", function(stream) {
	this.TAI_timestamp = stream.readUint64();

	status_bits = stream.readUint8();
	this.sychronization_state = (status_bits >> 7) & 0x01;
	this.timestamp_generation_failure = (status_bits >> 6) & 0x01;
	this.timestamp_is_modified = (status_bits >> 5) & 0x01;
});
BoxParser.createFullBoxCtor("itai", function(stream) {
	this.TAI_time_stamp = stream.readUint64();
	this.status_bits = stream.readUint8();
});
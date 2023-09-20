BoxParser.createFullBoxCtor("taic", "TAIClockInfoBox", function(stream) {
	this.time_uncertainty = stream.readUint64();
	this.clock_resolution = stream.readUint32();
	this.clock_drift_rate = stream.readInt32();
	var reserved_byte = stream.readUint8();
	this.clock_type = (reserved_byte & 0xC0) >> 6;
});
BoxParser.createFullBoxCtor("taic", function(stream) {
	this.time_uncertainty = stream.readUint64();
	this.correction_offset = stream.readInt64();
	this.clock_drift_rate = stream.readFloat32();
	this.clock_source = stream.readUint8();

	if (this.time_uncertainty === 0xffffffffffffffff) {
		this.time_uncertainty = "unknown";
	}

	if (this.correction_offset === 0x7fffffffffffffff) {
		this.correction_offset = "unknown";
	}
});
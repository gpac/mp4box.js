BoxParser.createFullBoxCtor("taic", function(stream) {
	this.time_uncertainty = stream.readUint64();
	this.clock_resolution = stream.readUint32();
	this.clock_drift_rate = stream.readInt32();
	this.clock_type = stream.readUint8();

	if (this.time_uncertainty === 0xffffffffffffffff) {
		this.time_uncertainty = "unknown";
	}


});
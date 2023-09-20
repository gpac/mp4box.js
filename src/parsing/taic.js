BoxParser.createFullBoxCtor("taic", function(stream) {
	this.time_uncertainty = stream.readUint64();
	this.correction_offset = stream.readInt64();
	this.clock_drift_rate = stream.readFloat32();
	this.reference_source_type = stream.readUint8();
});
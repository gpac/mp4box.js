BoxParser.createFullBoxCtor("taic", function(stream) {
	this.time_uncertainty = stream.readUint64();
	this.correction_offset = stream.readInt64();
	this.clock_drift_rate = stream.readFloat32();
	//if (clock_drift_rate == 0x7FC0 0000)
	//	value is an IEEE 754 quiet NaN.
	//	Interpret the value as unknown 
	this.clock_source = stream.readUint8();
});
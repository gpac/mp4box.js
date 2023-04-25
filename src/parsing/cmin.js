BoxParser.createFullBoxCtor("cmin", function(stream) {
	this.focal_length_x = stream.readInt32();
	this.principal_point_x = stream.readInt32();
	this.principal_point_y = stream.readInt32();
	if (this.flags & 0x1) {
		this.focal_length_y = stream.readInt32();
		this.skew_factor = stream.readInt32();
	}
});
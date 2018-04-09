BoxParser.createSampleGroupCtor("rash", function(stream) {
	this.operation_point_count = stream.readUint16();
	if (this.description_length !== 2+(this.operation_point_count === 1?2:this.operation_point_count*6)+9) {
		Log.warn("BoxParser", "Mismatch in "+this.grouping_type+" sample group length");
		this.data =  stream.readUint8Array(this.description_length-2);
	} else {
		if (this.operation_point_count === 1) {
			this.target_rate_share = stream.readUint16();
		} else {
			this.target_rate_share = [];
			this.available_bitrate = [];
			for (var i = 0; i < this.operation_point_count; i++) {
				this.available_bitrate[i] = stream.readUint32();
				this.target_rate_share[i] = stream.readUint16();
			}
		}
		this.maximum_bitrate = stream.readUint32();
		this.minimum_bitrate = stream.readUint32();
		this.discard_priority = stream.readUint8();
	}
});


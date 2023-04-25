BoxParser.createFullBoxCtor("cmex", function(stream) {
	if (this.flags & 0x1) {
		this.pos_x = stream.readInt32();
	}
	if (this.flags & 0x2) {
		this.pos_y = stream.readInt32();
	}
	if (this.flags & 0x4) {
		this.pos_z = stream.readInt32();
	}
	if (this.flags & 0x8) {
		if (this.version == 0) {
			if (this.flags & 0x10) {
				this.quat_x = stream.readInt32();
				this.quat_y = stream.readInt32();
				this.quat_z = stream.readInt32();
			} else {
				this.quat_x = stream.readInt16();
				this.quat_y = stream.readInt16();
				this.quat_z = stream.readInt16();
			}
		} else if (this.version == 1) {
			//ViewpointGlobalCoordinateSysRotationStruct rot;
		}
	}
	if (this.flags & 0x20) {
		this.id = stream.readUint32();
	}
});

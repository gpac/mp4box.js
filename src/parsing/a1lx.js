BoxParser.createFullBoxCtor("a1lx", function(stream) {
	var FieldLength = ((this.flags & 1) + 1) * 16;
	this.layer_size = [];
	for (var i = 0; i < 4; i++) {
		if (FieldLength == 16) {
			this.layer_size[i] = stream.readUint16();
		} else {
			this.layer_size[i] = stream.readUint32();
		}
	}
});
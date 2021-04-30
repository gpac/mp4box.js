BoxParser.createBoxCtor("a1lx", function(stream) {
	var large_size = stream.readUint8() & 1;
	var FieldLength = ((large_size & 1) + 1) * 16;
	this.layer_size = [];
	for (var i = 0; i < 3; i++) {
		if (FieldLength == 16) {
			this.layer_size[i] = stream.readUint16();
		} else {
			this.layer_size[i] = stream.readUint32();
		}
	}
});
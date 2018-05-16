BoxParser.createFullBoxCtor("pssh", function(stream) {
	this.system_id = BoxParser.parseHex16(stream);
	if (this.version > 0) {
		var count = stream.readUint32();
		this.kid = [];
		for (var i = 0; i < count; i++) {
			this.kid[i] = BoxParser.parseHex16(stream);
		}
	}
	var datasize = stream.readUint32();
	if (datasize > 0) {
		this.data = stream.readUint8Array(datasize);
	}
});


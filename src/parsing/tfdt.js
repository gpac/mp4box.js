BoxParser.createFullBoxCtor("tfdt", function(stream) {
	if (this.version == 1) {
		this.baseMediaDecodeTime = stream.readUint64();
	} else {
		this.baseMediaDecodeTime = stream.readUint32();
	}
});


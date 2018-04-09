BoxParser.createFullBoxCtor("stco", function(stream) {
	var entry_count;
	entry_count = stream.readUint32();
	if (this.version === 0) {
		this.chunk_offsets = stream.readUint32Array(entry_count);
	}
});


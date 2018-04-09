BoxParser.createFullBoxCtor("co64", function(stream) {
	var entry_count;
	var i;
	entry_count = stream.readUint32();
	this.chunk_offsets = [];
	if (this.version === 0) {
		for(i=0; i<entry_count; i++) {
			this.chunk_offsets.push(stream.readUint64());
		}
	}
});


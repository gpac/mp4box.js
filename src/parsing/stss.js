BoxParser.createFullBoxCtor("stss", function(stream) {
	var i;
	var entry_count;
	entry_count = stream.readUint32();
	if (this.version === 0) {
		this.sample_numbers = [];
		for(i=0; i<entry_count; i++) {
			this.sample_numbers.push(stream.readUint32());
		}
	}
});


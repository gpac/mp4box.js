BoxParser.createFullBoxCtor("ctts", function(stream) {
	var entry_count;
	var i;
	entry_count = stream.readUint32();
	this.sample_counts = [];
	this.sample_offsets = [];
	if (this.version === 0) {
		for(i=0; i<entry_count; i++) {
			this.sample_counts.push(stream.readUint32());
			/* some files are buggy and declare version=0 while using signed offsets.
			   The likelyhood of using the most significant bit in a 32-bits time offset is very low,
			   so using signed value here as well */
			   var value = stream.readInt32();
			   if (value < 0) {
			   		Log.warn("BoxParser", "ctts box uses negative values without using version 1");
			   }
			this.sample_offsets.push(value);
		}
	} else if (this.version == 1) {
		for(i=0; i<entry_count; i++) {
			this.sample_counts.push(stream.readUint32());
			this.sample_offsets.push(stream.readInt32()); /* signed */
		}
	}
});


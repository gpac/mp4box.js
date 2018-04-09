BoxParser.createFullBoxCtor("stts", function(stream) {
	var entry_count;
	var i;
	var delta;
	entry_count = stream.readUint32();
	this.sample_counts = [];
	this.sample_deltas = [];
	if (this.version === 0) {
		for(i=0; i<entry_count; i++) {
			this.sample_counts.push(stream.readUint32());
			delta = stream.readInt32();
			if (delta < 0) {
				Log.warn("BoxParser", "File uses negative stts sample delta, using value 1 instead, sync may be lost!");
				delta = 1;
			}
			this.sample_deltas.push(delta);
		}
	}
});


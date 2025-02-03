BoxParser.createFullBoxCtor("cslg", function(stream) {
	var entry_count;
	if (this.version === 0) {
		this.compositionToDTSShift = stream.readInt32(); /* signed */
		this.leastDecodeToDisplayDelta = stream.readInt32(); /* signed */
		this.greatestDecodeToDisplayDelta = stream.readInt32(); /* signed */
		this.compositionStartTime = stream.readInt32(); /* signed */
		this.compositionEndTime = stream.readInt32(); /* signed */
	} else if (this.version === 1) {
		this.compositionToDTSShift = stream.readInt64(); /* signed */
		this.leastDecodeToDisplayDelta = stream.readInt64(); /* signed */
		this.greatestDecodeToDisplayDelta = stream.readInt64(); /* signed */
		this.compositionStartTime = stream.readInt64(); /* signed */
		this.compositionEndTime = stream.readInt64(); /* signed */
	}
});


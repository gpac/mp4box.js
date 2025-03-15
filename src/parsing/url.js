BoxParser.createFullBoxCtor("url ", "DataEntryUrlBox", function(stream) {
	if (this.flags !== 0x000001) {
		this.location = stream.readCString();
	}
});


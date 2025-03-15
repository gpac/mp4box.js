BoxParser.createFullBoxCtor("urn ", "DataEntryUrnBox", function(stream) {
	this.name = stream.readCString();
	if (this.size - this.hdr_size - this.name.length - 1 > 0) {
		this.location = stream.readCString();
	}
});


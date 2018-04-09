BoxParser.createFullBoxCtor("url ", function(stream) {
	if (this.flags !== 0x000001) {
		this.location = stream.readCString();
	}
});


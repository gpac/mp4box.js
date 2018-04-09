BoxParser.createFullBoxCtor("elng", function(stream) {
	this.extended_language = stream.readString(this.size-this.hdr_size);
});


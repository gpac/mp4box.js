BoxParser.createFullBoxCtor("elng", "ExtendedLanguageBox", function(stream) {
	this.extended_language = stream.readString(this.size-this.hdr_size);
});


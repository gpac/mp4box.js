BoxParser.createBoxCtor("frma", "OriginalFormatBox", function(stream) {
	this.data_format = stream.readString(4);
});


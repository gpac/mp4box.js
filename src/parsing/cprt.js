BoxParser.createFullBoxCtor("cprt", function (stream) {
	this.parseLanguage(stream);
	this.notice = stream.readCString();
});


BoxParser.createFullBoxCtor("cprt", "CopyrightBox", function (stream) {
	this.parseLanguage(stream);
	this.notice = stream.readCString();
});


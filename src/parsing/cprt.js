BoxParser.cprtBox.prototype.parse = function (stream) {
	this.parseFullHeader(stream);
	this.parseLanguage(stream);
	this.notice = stream.readCString();
}


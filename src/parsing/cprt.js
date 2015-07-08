BoxParser.cprtBox.prototype.parse = function (stream) {
	this.parseFullHeader(stream);
	this.parseLanguage(stream);
	this.notice = stream.readCString();
	if (stream.getPosition() > this.start+this.size) {
		Log.warn("BoxParser", "Parsed more than the size of the box (null-terminated string problem?)");
		stream.seek(this.start+this.size);
	}
}


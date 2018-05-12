var BoxParser = require('../../box.js').BoxParser;

BoxParser.sbttSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.content_encoding = stream.readCString();
	this.mime_format = stream.readCString();
	this.parseFooter(stream);
}


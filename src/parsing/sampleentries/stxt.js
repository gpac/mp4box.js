var BoxParser = require('../../box.js').BoxParser;

BoxParser.stxtSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.content_encoding = stream.readCString();
	this.mime_format = stream.readCString();
	this.parseFooter(stream);
}


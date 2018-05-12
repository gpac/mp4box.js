var BoxParser = require('../../box.js').BoxParser;

BoxParser.wvttSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.parseFooter(stream);
}


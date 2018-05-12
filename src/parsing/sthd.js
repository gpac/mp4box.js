var BoxParser = require('../box.js').BoxParser;

BoxParser.sthdBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
}


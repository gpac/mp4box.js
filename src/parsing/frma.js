var BoxParser = require('../box.js').BoxParser;

BoxParser.frmaBox.prototype.parse = function(stream) {
	this.data_format = stream.readString(4);
}


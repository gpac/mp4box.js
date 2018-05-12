var BoxParser = require('../box.js').BoxParser;

BoxParser.txtCBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.config = stream.readCString();
}


var BoxParser = require('../box.js').BoxParser;

BoxParser.paylBox.prototype.parse = function(stream) {
	this.text = stream.readString(this.size - this.hdr_size);
}


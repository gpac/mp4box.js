var BoxParser = require('../box.js').BoxParser;

BoxParser.drepBox.prototype.parse = function(stream) {
	this.bytessent = stream.readUint64();
}


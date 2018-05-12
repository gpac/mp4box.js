var BoxParser = require('../box.js').BoxParser;

BoxParser.tpylBox.prototype.parse = function(stream) {
	this.bytessent = stream.readUint64();
}


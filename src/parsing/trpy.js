var BoxParser = require('../box.js').BoxParser;

BoxParser.trpyBox.prototype.parse = function(stream) {
	this.bytessent = stream.readUint64();
}


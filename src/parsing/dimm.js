var BoxParser = require('../box.js').BoxParser;

BoxParser.dimmBox.prototype.parse = function(stream) {
	this.bytessent = stream.readUint64();
}


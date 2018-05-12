var BoxParser = require('../box.js').BoxParser;

BoxParser.dmedBox.prototype.parse = function(stream) {
	this.bytessent = stream.readUint64();
}


var BoxParser = require('../box.js').BoxParser;

BoxParser.tmaxBox.prototype.parse = function(stream) {
	this.time = stream.readUint32();
}


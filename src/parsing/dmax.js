var BoxParser = require('../box.js').BoxParser;

BoxParser.dmaxBox.prototype.parse = function(stream) {
	this.time = stream.readUint32();
}


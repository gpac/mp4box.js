var BoxParser = require('../box.js').BoxParser;

BoxParser.pmaxBox.prototype.parse = function(stream) {
	this.bytes = stream.readUint32();
}


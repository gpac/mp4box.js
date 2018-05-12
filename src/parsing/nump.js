var BoxParser = require('../box.js').BoxParser;

BoxParser.numpBox.prototype.parse = function(stream) {
	this.packetssent = stream.readUint64();
}


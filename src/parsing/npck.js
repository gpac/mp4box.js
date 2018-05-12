var BoxParser = require('../box.js').BoxParser;

BoxParser.npckBox.prototype.parse = function(stream) {
	this.packetssent = stream.readUint32();
}


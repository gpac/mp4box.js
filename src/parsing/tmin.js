var BoxParser = require('../box.js').BoxParser;

BoxParser.tminBox.prototype.parse = function(stream) {
	this.time = stream.readUint32();
}


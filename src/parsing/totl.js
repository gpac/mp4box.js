var BoxParser = require('../box.js').BoxParser;

BoxParser.totlBox.prototype.parse = function(stream) {
	this.bytessent = stream.readUint32();
}


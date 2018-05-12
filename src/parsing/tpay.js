var BoxParser = require('../box.js').BoxParser;

BoxParser.tpayBox.prototype.parse = function(stream) {
	this.bytessent = stream.readUint32();
}


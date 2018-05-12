var BoxParser = require('../box.js').BoxParser;

BoxParser.pixiBox.prototype.parse = function(stream) {
	var i;
	this.parseFullHeader(stream);
	this.num_channels = stream.readUint8();
	this.bits_per_channels = [];
	for (i = 0; i < this.num_channels; i++) {
		this.bits_per_channels[i] = stream.readUint8();
	}
}
var BoxParser = require('../box.js').BoxParser;

BoxParser.metaBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.boxes = [];
	BoxParser.ContainerBox.prototype.parse.call(this, stream);
}

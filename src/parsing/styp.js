var BoxParser = require('../box.js').BoxParser;

BoxParser.stypBox.prototype.parse = function(stream) {
	BoxParser.ftypBox.prototype.parse.call(this, stream);
}


var BoxParser = require('../../box.js').BoxParser;

BoxParser.rollSampleGroupEntry.prototype.parse = function(stream) {
	this.roll_distance = stream.readInt16();
}


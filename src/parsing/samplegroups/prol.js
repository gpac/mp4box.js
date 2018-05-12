var BoxParser = require('../../box.js').BoxParser;

BoxParser.prolSampleGroupEntry.prototype.parse= function(stream) {
	this.roll_distance = stream.readInt16();
}


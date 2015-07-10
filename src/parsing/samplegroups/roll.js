BoxParser.rollSampleGroupEntry.prototype.parse = function(stream, length) {
	this.roll_distance = stream.readInt16();
}


var BoxParser = require('../box.js').BoxParser;

BoxParser.TrackGroupTypeBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.track_group_id = stream.readUint32();
}


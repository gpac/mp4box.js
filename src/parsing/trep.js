var BoxParser = require('../box.js').BoxParser;

BoxParser.trepBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.track_ID = stream.readUint32();
	this.boxes = [];
	while (stream.getPosition() < this.start+this.size) {
		var ret = BoxParser.parseOneBox(stream, false, this.size - (stream.getPosition() - this.start));
		if (ret.code === BoxParser.OK) {
			var box = ret.box;
			this.boxes.push(box);		
		} else {
			return;
		}
	}
}


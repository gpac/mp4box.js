BoxParser.trepBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.track_ID = stream.readUint32();
	this.boxes = [];
	while (stream.position < this.start+this.size) {
		ret = BoxParser.parseOneBox(stream);
		box = ret.box;
		this.boxes.push(box);
	}
}


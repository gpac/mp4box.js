BoxParser.createFullBoxCtor("stvi", function(stream) {
	var tmp32 = stream.readUint32();
	this.single_view_allowed = tmp32 & 0x3;
	this.stereo_scheme = stream.readUint32();
	var length = stream.readUint32();
	this.stereo_indication_type = stream.readString(length);
	var ret;
	var box;
	this.boxes = [];
	while (stream.getPosition() < this.start+this.size) {
		ret = BoxParser.parseOneBox(stream, false, this.size - (stream.getPosition() - this.start));
		if (ret.code === BoxParser.OK) {
			box = ret.box;
			this.boxes.push(box);
			this[box.type] = box;
		} else {
			return;
		}
	}
});


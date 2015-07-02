BoxParser.stsdBox = function(size) {
	BoxParser.FullBox.call(this, "stsd", size);
	this.entries = [];
};
BoxParser.stsdBox.prototype = new BoxParser.FullBox();
BoxParser.stsdBox.prototype.parse = function(stream) {
	var ret;
	var entryCount;
	var box;
	this.parseFullHeader(stream);
	entryCount = stream.readUint32();
	for (i = 1; i <= entryCount; i++) {
		ret = BoxParser.parseOneBox(stream, true);
		if (BoxParser[ret.type+"SampleEntry"]) {
			box = new BoxParser[ret.type+"SampleEntry"](ret.size);
			box.hdr_size = ret.hdr_size;
			box.start = ret.start;
			box.fileStart = ret.fileStart;
		} else {
			Log.warn("BoxParser", "Unknown sample entry type: "+ret.type);
			box = new BoxParser.SampleEntry(ret.type, ret.size, ret.hdr_size, ret.start, ret.fileStart);
		}
		box.parse(stream);
		this.entries.push(box);
	}
}


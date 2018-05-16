BoxParser.createFullBoxCtor("stsd", function(stream) {
	var i;
	var ret;
	var entryCount;
	var box;
	this.entries = [];
	entryCount = stream.readUint32();
	for (i = 1; i <= entryCount; i++) {
		ret = BoxParser.parseOneBox(stream, true, this.size - (stream.getPosition() - this.start));
		if (ret.code === BoxParser.OK) {
			if (BoxParser[ret.type+"SampleEntry"]) {
				box = new BoxParser[ret.type+"SampleEntry"](ret.size);
				box.hdr_size = ret.hdr_size;
				box.start = ret.start;
			} else {
				Log.warn("BoxParser", "Unknown sample entry type: "+ret.type);
				box = new BoxParser.SampleEntry(ret.type, ret.size, ret.hdr_size, ret.start);
			}
			if (box.write === BoxParser.SampleEntry.prototype.write) {
				Log.info("BoxParser", "SampleEntry "+box.type+" box writing not yet implemented, keeping unparsed data in memory for later write");
				box.parseDataAndRewind(stream);
			}
			box.parse(stream);
			this.entries.push(box);
		} else {
			return;
		}
	}
});


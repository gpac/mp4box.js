BoxParser.createFullBoxCtor("dref", function(stream) {
	var ret;
	var box;
	this.entries = [];
	var entry_count = stream.readUint32();
	for (var i = 0; i < entry_count; i++) {
		ret = BoxParser.parseOneBox(stream, false, this.size - (stream.getPosition() - this.start));
		if (ret.code === BoxParser.OK) {
			box = ret.box;
			this.entries.push(box);
		} else {
			return;
		}
	}
});


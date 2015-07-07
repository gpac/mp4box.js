BoxParser.drefBox.prototype.parse = function(stream) {
	var ret;
	var box;
	this.parseFullHeader(stream);
	this.entries = [];
	var entry_count = stream.readUint32();
	for (var i = 0; i < entry_count; i++) {
		ret = BoxParser.parseOneBox(stream, false);
		box = ret.box;
		this.entries.push(box);
	}
}


BoxParser.iinfBox.prototype.parse = function(stream) {
	var ret;
	this.parseFullHeader(stream);
	if (this.version === 0) {
		this.entry_count = stream.readUint16();
	} else {
		this.entry_count = stream.readUint32();
	}
	this.item_infos = [];
	for (var i = 0; i < this.entry_count; i++) {
		ret = BoxParser.parseOneBox(stream, false, ththis.size - (stream.getPosition() - this.start));
		if (ret.code === BoxParser.OK) {
			if (ret.box.type !== "infe") {
				Log.error("BoxParser", "Expected 'infe' box, got "+ret.box.type);
			}
			this.item_infos[i] = ret.box;
		} else {
			return;
		}
	}
}


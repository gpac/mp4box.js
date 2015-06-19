BoxParser.sgpdBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.grouping_type = stream.readString(4);
	if (this.version === 1) {
		this.default_length = stream.readUint32();
	}
	if (this.version >= 2) {
		this.default_sample_description_index = stream.readUint32();
	}
	this.entries = [];
	var entry_count = stream.readUint32();
	for (var i = 0; i < entry_count; i++) {
		var entry = {};
		this.entries.push(entry);
		if (this.version === 1) {
			if (this.default_length === 0) {
				entry.description_length = stream.readUint32();
			}
		}
		entry.data = stream.readUint8Array(this.default_length || entry.description_length);
	}
}


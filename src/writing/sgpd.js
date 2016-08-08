BoxParser.sgpdBox.prototype.write = function(stream) {
	var i;
	var entry;
	// leave version as read
	// this.version;
	this.flags = 0;
	this.size = 12;
	for (i = 0; i < this.entries.length; i++) {
		entry = this.entries[i];
		if (this.version === 1) {
			if (this.default_length === 0) {
				this.size += 4;
			}
			this.size += entry.data.length;
		}
	}
	this.writeHeader(stream);
	stream.writeString(this.grouping_type, null, 4);
	if (this.version === 1) {
		stream.writeUint32(this.default_length);
	}
	if (this.version >= 2) {
		stream.writeUint32(this.default_sample_description_index);
	}
	stream.writeUint32(this.entries.length);
	for (i = 0; i < this.entries.length; i++) {
		entry = this.entries[i];
		if (this.version === 1) {
			if (this.default_length === 0) {
				stream.writeUint32(entry.description_length);
			}
		}
		entry.write(stream);
	}
}



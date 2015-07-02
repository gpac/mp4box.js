BoxParser.sbgpBox.prototype.write = function(stream) {
	this.version = 1;	
	this.flags = 0;
	this.size = 12+8*this.entries.length;
	this.writeHeader(stream);
	stream.writeString(this.grouping_type, null, 4);
	stream.writeUint32(this.grouping_type_parameter);
	stream.writeUint32(this.entries.length);
	for (var i = 0; i < this.entries.length; i++) {
		var entry = this.entries[i];
		stream.writeInt32(entry.sample_count);
		stream.writeInt32(entry.group_description_index);
	}
}


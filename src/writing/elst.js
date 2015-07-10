BoxParser.elstBox.prototype.write = function(stream) {
	this.version = 0;	
	this.flags = 0;
	this.size = 4+12*this.entries.length;
	this.writeHeader(stream);
	stream.writeUint32(this.entries.length);
	for (var i = 0; i < this.entries.length; i++) {
		var entry = this.entries[i];
		stream.writeUint32(entry.segment_duration);
		stream.writeInt32(entry.media_time);
		stream.writeInt16(entry.media_rate_integer);
		stream.writeInt16(entry.media_rate_fraction);
	}
}


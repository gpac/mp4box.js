BoxParser.cttsBox.prototype.write = function(stream) {
	var i;
	this.version = 1;
	this.flags = 0;
	this.size = 4+8*this.sample_counts.length;
	this.writeHeader(stream);
	stream.writeUint32(this.sample_counts.length);
	for(i=0; i<this.sample_counts.length; i++) {
		stream.writeUint32(this.sample_counts[i]);
		stream.writeInt32(this.sample_offsets[i]); /* signed */
	}
}


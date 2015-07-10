BoxParser.co64Box.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 0;
	this.size = 4+8*this.chunk_offsets.length;
	this.writeHeader(stream);
	stream.writeUint32(this.chunk_offsets.length);
	for(i=0; i<this.chunk_offsets.length; i++) {
		stream.writeUint64(this.chunk_offsets[i]);
	}
}


BoxParser.stszBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 0;
	this.size = 8+12*this.sample_sizes.length;
	this.writeHeader(stream);
	stream.writeUint32(0);
	stream.writeUint32(this.sample_sizes.length);
	stream.writeUint32Array(this.sample_sizes);
}


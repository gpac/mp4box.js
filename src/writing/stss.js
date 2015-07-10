BoxParser.stssBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 4+4*this.sample_numbers.length;
	this.writeHeader(stream);
	stream.writeUint32(this.sample_numbers.length);
	stream.writeUint32Array(this.sample_numbers);
}


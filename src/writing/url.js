BoxParser["url Box"].prototype.write = function(stream) {
	this.version = 0;	
	if (this.location) {
		this.flags = 0;
		this.size = this.location.length+1;
	} else {
		this.flags = 0x000001;
		this.size = 0;
	}
	this.writeHeader(stream);
	if (this.location) {
		stream.writeCString(this.location);
	}
}


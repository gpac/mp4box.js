BoxParser["url Box"].prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.flags !== 0x000001) {
		this.location = stream.readCString();
	} 
}


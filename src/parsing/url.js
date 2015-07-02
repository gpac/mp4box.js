BoxParser["url Box"].prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.flags !== 0x000001) {
		this.location = stream.readCString();
	} else if (this.size - this.hdr_size) {
		Log.warn("BoxParser", "Invalid urlBox - contains data but flag not set");
		this.location = stream.readString(this.size - this.hdr_size);
	}
}


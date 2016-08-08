BoxParser.elngBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.extended_language = stream.readString(this.size-this.hdr_size);
}


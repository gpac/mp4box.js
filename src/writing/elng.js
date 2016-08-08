BoxParser.elngBox.prototype.write = function(stream) {
	this.version = 0;	
	this.flags = 0;
	this.size = this.extended_language.length;
	this.writeHeader(stream);
	stream.writeString(this.extended_language);
}


BoxParser.kindBox.prototype.write = function(stream) {
	this.version = 0;	
	this.flags = 0;
	this.size = (this.schemeURI.length+1)+(this.value.length+1);
	this.writeHeader(stream);
	stream.writeCString(this.schemeURI);
	stream.writeCString(this.value);
}


BoxParser.txtCBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.config = stream.readCString();
}


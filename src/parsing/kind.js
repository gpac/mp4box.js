BoxParser.kindBox = function(size) {
	BoxParser.FullBox.call(this, "kind", size);
	this.schemeURI = "";
	this.value = "";
}	
BoxParser.kindBox.prototype = new BoxParser.FullBox();
BoxParser.kindBox.prototype.parse = function(stream) {
	var ret;
	this.parseFullHeader(stream);
	this.schemeURI = stream.readCString();
	this.value = stream.readCString();
}

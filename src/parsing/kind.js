BoxParser.createFullBoxCtor("kind", function(stream) {
	this.schemeURI = stream.readCString();
	this.value = stream.readCString();
});

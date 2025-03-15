BoxParser.createFullBoxCtor("kind", "KindBox", function(stream) {
	this.schemeURI = stream.readCString();
	this.value = stream.readCString();
});

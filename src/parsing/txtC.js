BoxParser.createFullBoxCtor("txtC", "TextConfigBox", function(stream) {
	this.config = stream.readCString();
});


BoxParser.createFullBoxCtor("udes", "UserDescriptionProperty", function(stream) {
	this.lang = stream.readCString();
	this.name = stream.readCString();
	this.description = stream.readCString();
	this.tags = stream.readCString();
});


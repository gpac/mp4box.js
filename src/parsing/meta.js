BoxParser.createFullBoxCtor("meta", "MetaBox", function(stream) {
	this.boxes = [];
	BoxParser.ContainerBox.prototype.parse.call(this, stream);
});

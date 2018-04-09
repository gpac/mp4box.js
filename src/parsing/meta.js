BoxParser.createFullBoxCtor("meta", function(stream) {
	this.boxes = [];
	BoxParser.ContainerBox.prototype.parse.call(this, stream);
});

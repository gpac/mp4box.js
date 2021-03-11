BoxParser.createBoxCtor("lsel", function(stream) {
	this.layer_id = stream.readUint16();
});
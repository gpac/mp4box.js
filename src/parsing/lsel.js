BoxParser.createBoxCtor("lsel", "LayerSelectorProperty", function(stream) {
	this.layer_id = stream.readUint16();
});
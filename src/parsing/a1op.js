BoxParser.createBoxCtor("a1op", "OperatingPointSelectorProperty", function(stream) {
	this.op_index = stream.readUint8();
});
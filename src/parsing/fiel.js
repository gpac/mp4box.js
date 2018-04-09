BoxParser.createBoxCtor("fiel", function(stream) {
	this.fieldCount = stream.readUint8();
	this.fieldOrdering = stream.readUint8();
});


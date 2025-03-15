BoxParser.createBoxCtor("fiel", "FieldHandlingBox", function(stream) {
	this.fieldCount = stream.readUint8();
	this.fieldOrdering = stream.readUint8();
});


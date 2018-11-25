BoxParser.createFullBoxCtor("clef", function(stream) {
	this.width = stream.readUint32();
	this.height = stream.readUint32();
});
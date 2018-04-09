BoxParser.createFullBoxCtor("vmhd", function(stream) {
	this.graphicsmode = stream.readUint16();
	this.opcolor = stream.readUint16Array(3);
});


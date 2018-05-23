BoxParser.createFullBoxCtor("CoLL", function(stream) {
	this.maxCLL = stream.readUint16();
    this.maxFALL = stream.readUint16();
});


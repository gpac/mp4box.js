BoxParser.createFullBoxCtor("CoLL", "ContentLightLevelBox", function(stream) {
	this.maxCLL = stream.readUint16();
    this.maxFALL = stream.readUint16();
});


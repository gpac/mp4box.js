BoxParser.createBoxCtor("clap", function(stream) {
	this.cleanApertureWidthN = stream.readUint32();
	this.cleanApertureWidthD = stream.readUint32();
	this.cleanApertureHeightN = stream.readUint32();
	this.cleanApertureHeightD = stream.readUint32();
	this.horizOffN = stream.readUint32();
	this.horizOffD = stream.readUint32();
	this.vertOffN = stream.readUint32();
	this.vertOffD = stream.readUint32();
});
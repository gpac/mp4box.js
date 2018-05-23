BoxParser.createFullBoxCtor("SmDm", function(stream) {
	this.primaryRChromaticity_x = stream.readUint16();
    this.primaryRChromaticity_y = stream.readUint16();
    this.primaryGChromaticity_x = stream.readUint16();
    this.primaryGChromaticity_y = stream.readUint16();
    this.primaryBChromaticity_x = stream.readUint16();
    this.primaryBChromaticity_y = stream.readUint16();
    this.whitePointChromaticity_x = stream.readUint16();
    this.whitePointChromaticity_y = stream.readUint16();
    this.luminanceMax = stream.readUint32();
    this.luminanceMin = stream.readUint32();
});


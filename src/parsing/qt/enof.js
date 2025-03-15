BoxParser.createFullBoxCtor("enof", "TrackEncodedPixelsDimensionsBox", function(stream) {
	this.width = stream.readUint32();
	this.height = stream.readUint32();
});
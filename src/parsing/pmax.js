BoxParser.createBoxCtor("pmax", "hintlargestpacket", function(stream) {
	this.bytes = stream.readUint32();
});


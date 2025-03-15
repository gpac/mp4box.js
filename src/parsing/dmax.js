BoxParser.createBoxCtor("dmax", "hintlongestpacket", function(stream) {
	this.time = stream.readUint32();
});


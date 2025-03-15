BoxParser.createBoxCtor("nump", "hintPacketsSent", function(stream) {
	this.packetssent = stream.readUint64();
});


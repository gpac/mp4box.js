BoxParser.createBoxCtor("npck", "hintPacketsSent", function(stream) {
	this.packetssent = stream.readUint32();
});


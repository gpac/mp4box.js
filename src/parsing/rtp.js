BoxParser.createBoxCtor("rtp ", "rtpmoviehintinformation", function(stream) {
	this.descriptionformat = stream.readString(4);
	this.sdptext = stream.readString(this.size - this.hdr_size - 4);
});


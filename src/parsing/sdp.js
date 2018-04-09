BoxParser.createBoxCtor("sdp ", function(stream) {
	this.sdptext = stream.readString(this.size - this.hdr_size);
});


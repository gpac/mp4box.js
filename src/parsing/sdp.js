BoxParser.createBoxCtor("sdp ", "rtptracksdphintinformation", function(stream) {
	this.sdptext = stream.readString(this.size - this.hdr_size);
});


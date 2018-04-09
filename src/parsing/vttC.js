BoxParser.createBoxCtor("vttC", function(stream) {
	this.text = stream.readString(this.size - this.hdr_size);
});


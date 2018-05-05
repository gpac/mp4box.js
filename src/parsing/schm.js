BoxParser.createFullBoxCtor("schm", function(stream) {
	this.scheme_type = stream.readString(4);
	this.scheme_version = stream.readUint32();
	if (this.flags & 0x000001) {
		this.scheme_uri = stream.readString(this.size - this.hdr_size - 8);
	}
});


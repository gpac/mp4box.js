BoxParser.createFullBoxCtor("hdlr", function(stream) {
	if (this.version === 0) {
		stream.readUint32();
		this.handler = stream.readString(4);
		stream.readUint32Array(3);
		this.name = stream.readString(this.size-this.hdr_size-20);
		if (this.name[this.name.length-1]==='\0') {
			this.name = this.name.slice(0,-1);
		}
	}
});


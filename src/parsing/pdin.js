BoxParser.createFullBoxCtor("pdin", function(stream) {
	var count = (this.size - this.hdr_size)/8;
	this.rate = [];
	this.initial_delay = [];
	for (var i = 0; i < count; i++) {
		this.rate[i] = stream.readUint32();
		this.initial_delay[i] = stream.readUint32();
	}
});


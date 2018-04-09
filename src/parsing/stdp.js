BoxParser.createFullBoxCtor("stdp", function(stream) {
	var count = (this.size - this.hdr_size)/2;
	this.priority = [];
	for (var i = 0; i < count; i++) {
		this.priority[i] = stream.readUint16();
	}
});


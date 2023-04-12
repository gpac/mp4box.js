BoxParser.createBoxCtor("tyco", function(stream) {
	var count = (this.size - this.hdr_size) / 4;
	this.compatible_brands = [];
	for (var i = 0; i < count; i++) {
		this.compatible_brands[i] = stream.readString(4);
	}
});


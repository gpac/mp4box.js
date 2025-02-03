BoxParser.createBoxCtor("ftyp", function(stream) {
	var toparse = this.size - this.hdr_size;
	this.major_brand = stream.readString(4);
	this.minor_version = stream.readUint32();
	toparse -= 8;
	this.compatible_brands = [];
	var i = 0;
	while (toparse>=4) {
		this.compatible_brands[i] = stream.readString(4);
		toparse -= 4;
		i++;
	}

	// Certain Boxes/Atoms have different behavior when parsing QTFF files
	if (this.major_brand.indexOf("qt") == 0)
		stream.behavior |= BoxParser.BEHAVIOR_QTFF;
});


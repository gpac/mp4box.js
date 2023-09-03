BoxParser.createFullBoxCtor("iloc", function(stream) {
	var byte;
	byte = stream.readUint8();
	this.offset_size = (byte >> 4) & 0xF;
	this.length_size = byte & 0xF;
	byte = stream.readUint8();
	this.base_offset_size = (byte >> 4) & 0xF;
	if (this.version === 1 || this.version === 2) {
		this.index_size = byte & 0xF;
	} else {
		this.index_size = 0;
		// reserved = byte & 0xF;
	}
	this.items = [];
	var item_count = 0;
	if (this.version < 2) {
		item_count = stream.readUint16();
	} else if (this.version === 2) {
		item_count = stream.readUint32();
	} else {
		throw "version of iloc box not supported";
	}
	for (var i = 0; i < item_count; i++) {
		var item = {};
		this.items.push(item);
		if (this.version < 2) {
			item.item_ID = stream.readUint16();
		} else if (this.version === 2) {
			item.item_ID = stream.readUint32();
		} else {
			throw "version of iloc box not supported";
		}
		if (this.version === 1 || this.version === 2) {
			item.construction_method = (stream.readUint16() & 0xF);
		} else {
			item.construction_method = 0;
		}
		item.data_reference_index = stream.readUint16();
		switch(this.base_offset_size) {
			case 0:
				item.base_offset = 0;
				break;
			case 4:
				item.base_offset = stream.readUint32();
				break;
			case 8:
				item.base_offset = stream.readUint64();
				break;
			default:
				throw "Error reading base offset size";
		}
		var extent_count = stream.readUint16();
		item.extents = [];
		for (var j=0; j < extent_count; j++) {
			var extent = {};
			item.extents.push(extent);
			if (this.version === 1 || this.version === 2) {
				switch(this.index_size) {
					case 0:
						extent.extent_index = 0;
						break;
					case 4:
						extent.extent_index = stream.readUint32();
						break;
					case 8:
						extent.extent_index = stream.readUint64();
						break;
					default:
						throw "Error reading extent index";
				}
			}
			switch(this.offset_size) {
				case 0:
					extent.extent_offset = 0;
					break;
				case 4:
					extent.extent_offset = stream.readUint32();
					break;
				case 8:
					extent.extent_offset = stream.readUint64();
					break;
				default:
					throw "Error reading extent index";
			}
			switch(this.length_size) {
				case 0:
					extent.extent_length = 0;
					break;
				case 4:
					extent.extent_length = stream.readUint32();
					break;
				case 8:
					extent.extent_length = stream.readUint64();
					break;
				default:
					throw "Error reading extent index";
			}
		}
	}
});


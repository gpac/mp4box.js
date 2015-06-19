BoxParser.ilocBox.prototype.parse = function(stream) {
	var byte;
	this.parseFullHeader(stream);
	byte = stream.readUint8();
	this.offset_size = (byte >> 4) & 0xF;
	this.length_size = byte & 0xF;
	byte = stream.readUint8();
	this.base_offset_size = (byte >> 4) & 0xF;
	if (this.version === 1) {
		this.index_size = byte & 0xF;
	} else {
		this.index_size = 0;		
		// reserved = byte & 0xF;
	}
	this.items = [];
	var item_count = stream.readUint16();
	for (var i = 0; i < item_count; i++) {
		var item = {};
		this.items.push(item);
		item.id = stream.readUint16();
		if (this.version === 1) {
			item.construction_method = (stream.readUint16() & 0xF);
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
		item.extent_count = stream.readUint16();
		for (var j=0; j < item.extent_count; j++) {
			if ((this.version === 1) && (this.index_size > 0)) {
				switch(this.index_size) {
					case 0:
						item.extent_index = 0;
						break;
					case 4:
						item.extent_index = stream.readUint32();
						break;
					case 8:
						item.extent_index = stream.readUint64();
						break;
					default:
						throw "Error reading extent index";
				}
			}
			switch(this.offset_size) {
				case 0:
					item.extent_offset = 0;
					break;
				case 4:
					item.extent_offset = stream.readUint32();
					break;
				case 8:
					item.extent_offset = stream.readUint64();
					break;
				default:
					throw "Error reading extent index";
			}
			switch(this.length_size) {
				case 0:
					item.extent_length = 0;
					break;
				case 4:
					item.extent_length = stream.readUint32();
					break;
				case 8:
					item.extent_length = stream.readUint64();
					break;
				default:
					throw "Error reading extent index";
			}
		}
	}
}

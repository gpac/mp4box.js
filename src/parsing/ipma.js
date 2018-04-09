BoxParser.createFullBoxCtor("ipma", function(stream) {
	var i, j;
	entry_count = stream.readUint32();
	this.associations = [];
	for(i=0; i<entry_count; i++) {
		var item_assoc = {};
		this.associations.push(item_assoc);
		if (this.version < 1) {
			item_assoc.id = stream.readUint16();
		} else {
			item_assoc.id = stream.readUint32();
		}
		var association_count = stream.readUint8();
		item_assoc.props = [];
		for (j = 0; j < association_count; j++) {
			var tmp = stream.readUint8();
			var p = [];
			item_assoc.props.push(p);
			var essential = (tmp & 0x80) >> 7;
			var property_index;
			if (this.flags & 0x1) {
				property_index = (tmp & 0x7F) << 8 | stream.readUint8();
			} else {
				property_index = (tmp & 0x7F);
			}
			p.push(property_index);
			p.push(essential === 1);
		}
	}
});


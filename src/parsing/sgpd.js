BoxParser.createFullBoxCtor("sgpd", function(stream) {
	this.grouping_type = stream.readString(4);
	Log.debug("BoxParser", "Found Sample Groups of type "+this.grouping_type);
	if (this.version === 1) {
		this.default_length = stream.readUint32();
	} else {
		this.default_length = 0;
	}
	if (this.version >= 2) {
		this.default_group_description_index = stream.readUint32();
	}
	this.entries = [];
	var entry_count = stream.readUint32();
	for (var i = 0; i < entry_count; i++) {
		var entry;
		if (BoxParser[this.grouping_type+"SampleGroupEntry"]) {
			entry = new BoxParser[this.grouping_type+"SampleGroupEntry"](this.grouping_type);
		}  else {
			entry = new BoxParser.SampleGroupEntry(this.grouping_type);
		}
		this.entries.push(entry);
		if (this.version === 1) {
			if (this.default_length === 0) {
				entry.description_length = stream.readUint32();
			} else {
				entry.description_length = this.default_length;
			}
		} else {
			entry.description_length = this.default_length;
		}
		if (entry.write === BoxParser.SampleGroupEntry.prototype.write) {
			Log.info("BoxParser", "SampleGroup for type "+this.grouping_type+" writing not yet implemented, keeping unparsed data in memory for later write");
			// storing data
			entry.data = stream.readUint8Array(entry.description_length);
			// rewinding
			stream.position -= entry.description_length;
		}
		entry.parse(stream);
	}
});


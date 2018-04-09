BoxParser.createFullBoxCtor("sbgp", function(stream) {
	this.grouping_type = stream.readString(4);
	if (this.version === 1) {
		this.grouping_type_parameter = stream.readUint32();
	} else {
		this.grouping_type_parameter = 0;
	}
	this.entries = [];
	var entry_count = stream.readUint32();
	for (var i = 0; i < entry_count; i++) {
		var entry = {};
		this.entries.push(entry);
		entry.sample_count = stream.readInt32();
		entry.group_description_index = stream.readInt32();
	}
});


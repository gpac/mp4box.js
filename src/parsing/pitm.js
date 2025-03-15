BoxParser.createFullBoxCtor("pitm", "PrimaryItemBox", function(stream) {
	if (this.version === 0) {
		this.item_id = stream.readUint16();
	} else {
		this.item_id = stream.readUint32();
	}
});


BoxParser.createFullBoxCtor("prdi", function(stream) {
	this.step_count = stream.readUint16();
	this.item_count = [];
	if (this.flags & 0x2) {
		for (var i = 0; i < this.step_count; i++) {
			this.item_count[i] = stream.readUint16();
		}
	}
});
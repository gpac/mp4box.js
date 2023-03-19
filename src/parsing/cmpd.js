BoxParser.createBoxCtor("cmpd", function(stream) {
	this.component_count = stream.readUint16();
	this.component_types = [];
	this.component_type_urls = [];
	for (i = 0; i < this.component_count; i++) {
		var component_type = stream.readUint16();
		this.component_types.push(component_type);
		if (component_type >= 0x8000) {
			this.component_type_urls.push(stream.readCString());
		}
	}
});
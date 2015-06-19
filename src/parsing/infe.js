BoxParser.infeBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.version === 0 || this.version === 1) {
		this.id = stream.readUint16();
		this.protection_index = stream.readUint16();
		this.name = stream.readCString();
		this.content_type = stream.readCString();
		this.content_encoding = stream.readCString();
	}
	if (this.version === 1) {
		this.extension_type = stream.readString(4);
		Log.error("BoxParser", "Cannot parse extension type");
	}
	if (this.version >= 2) {
		if (this.version === 2) {
			this.id = stream.readUint16();
		} else if (this.version === 3) {
			this.id = stream.readUint32();
		}
		this.protection_index = stream.readUint16();
		this.item_type = stream.readUint32();
		this.name = stream.readCString();
		if (this.item_type === "mime") {
			this.content_type = stream.readCString();
			this.content_encoding = stream.readCString();
		} else if (this.item_type === "uri ") {
			this.item_uri_type = stream.readCString();
		}
	}
}

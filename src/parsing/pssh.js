BoxParser.psshBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.system_id = stream.readUint8Array(16);
	if (this.version > 0) {
		var count = stream.readUint32();
		this.kid = [];
		for (var i = 0; i < count; i++) {
			this.kid[i] = stream.readUint8Array(16);
		}
	} 
	var datasize = stream.readUint32();
	if (datasize > 0) {
		this.data = stream.readUint8Array(datasize);
	}
}


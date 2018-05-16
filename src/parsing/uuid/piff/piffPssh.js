BoxParser.createUUIDBox("d08a4f1810f34a82b6c832d8aba183d3", true, false, function(stream) {
	this.system_id = BoxParser.parseHex16(stream);
	var datasize = stream.readUint32();
	if (datasize > 0) {
		this.data = stream.readUint8Array(datasize);
	}
});


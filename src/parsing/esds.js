BoxParser.esdsBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.data = stream.readUint8Array(this.size-this.hdr_size);
	if (typeof MPEG4DescriptorParser !== "undefined") {
		var esd_parser = new MPEG4DescriptorParser();
		this.esd = esd_parser.parseOneDescriptor(new DataStream(this.data.buffer, 0, DataStream.BIG_ENDIAN));
	} 
}


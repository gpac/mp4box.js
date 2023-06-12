BoxParser.createFullBoxCtor("esds", function(stream) {
	var esd_data = stream.readUint8Array(this.size-this.hdr_size);
	this.data = esd_data
	if (typeof MPEG4DescriptorParser !== "undefined") {
		var esd_parser = new MPEG4DescriptorParser();
		this.esd = esd_parser.parseOneDescriptor(new DataStream(esd_data.buffer, 0, DataStream.BIG_ENDIAN));
	}
});


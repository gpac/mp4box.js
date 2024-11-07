BoxParser.esdsBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = this.esd.size;
	this.writeHeader(stream);
	if (typeof MPEG4DescriptorWriter !== "undefined") {
		var esd_writer = new MPEG4DescriptorWriter(this.esd);
		esd_writer.writeOneDescriptor(stream);
	}
}
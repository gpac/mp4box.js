var MPEG4DescriptorParser = require('../descriptor.js').MPEG4DescriptorParser;
var BoxParser = require('../box.js').BoxParser;

var DataStream = require('../DataStream.js').DataStream;

BoxParser.esdsBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	var esd_data = stream.readUint8Array(this.size-this.hdr_size);
	if (typeof MPEG4DescriptorParser !== "undefined") {
		var esd_parser = new MPEG4DescriptorParser();
		this.esd = esd_parser.parseOneDescriptor(new DataStream(esd_data.buffer, 0, DataStream.BIG_ENDIAN));
	} 
}


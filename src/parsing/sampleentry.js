BoxParser.SampleEntry.prototype.parseHeader = function(stream) {
	stream.readUint8Array(6);
	this.data_reference_index = stream.readUint16();
}

BoxParser.SampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	stream.seek(this.start+this.size);
}

BoxParser.SampleEntry.prototype.parseFooter = function(stream) {
	var ret;
	var box;
	while (stream.getPosition() < this.start+this.size) {
		ret = BoxParser.parseOneBox(stream, false);
		box = ret.box;
		this.boxes.push(box);
		this[box.type] = box;
	}	
}

BoxParser.VisualSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	stream.readUint16(); 
	stream.readUint16();
	stream.readUint32Array(3);
	this.width = stream.readUint16();
	this.height = stream.readUint16();
	this.horizresolution = stream.readUint32();
	this.vertresolution = stream.readUint32();
	stream.readUint32();
	this.frame_count = stream.readUint16();
	this.compressorname = stream.readString(32);
	this.depth = stream.readUint16();
	stream.readUint16();
	this.parseFooter(stream);
}

BoxParser.AudioSampleEntry.prototype.parse = function(stream) {
    this.parseHeader(stream);
    this.version = stream.readUint16();
    this.revision = stream.readUint16();
    this.vendor = stream.readUint32();
    this.channel_count = stream.readUint16();
    this.samplesize = stream.readUint16();
    this.compressionId = stream.readInt16();
    this.packetSize = stream.readUint16();
    this.samplerate = (stream.readUint32() / (1 << 16));
    if (this.version == 1) {
        this.samplesPerPacket = stream.readUint32();
        this.bytesPerPacket = stream.readUint32();
        this.bytesPerFrame = stream.readUint32();
        this.bytesPerSample = stream.readUint32();
    }
    this.parseFooter(stream);
}

BoxParser.SubtitleSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.parseFooter(stream);
}

BoxParser.MetadataSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.parseFooter(stream);
}

BoxParser.SystemSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.parseFooter(stream);
}

BoxParser.metxSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.content_encoding = stream.readCString();
	this.namespace = stream.readCString();
	this.schema_location = stream.readCString();
	this.parseFooter(stream);
}

BoxParser.mettSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.content_encoding = stream.readCString();
	this.mime_format = stream.readCString();
	this.parseFooter(stream);
}

BoxParser.sbttSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.content_encoding = stream.readCString();
	this.mime_format = stream.readCString();
	this.parseFooter(stream);
}

BoxParser.stxtSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.content_encoding = stream.readCString();
	this.mime_format = stream.readCString();
	this.parseFooter(stream);
}

BoxParser.stppSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.namespace = stream.readCString();
	this.schema_location = stream.readCString();
	this.auxiliary_mime_types = stream.readCString();
	this.parseFooter(stream);
}

BoxParser.tx3gSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.displayFlags = stream.readUint32();
	this.horizontal_justification = stream.readInt8();
	this.vertical_justification = stream.readInt8();
	this.bg_color_rgba = stream.readUint8Array(4);
	this.box_record = stream.readInt16Array(4);
	this.style_record = stream.readUint8Array(12);
	this.parseFooter(stream);
}

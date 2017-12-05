BoxParser.SampleEntry.prototype.parseHeader = function(stream) {
	stream.readUint8Array(6);
	this.data_reference_index = stream.readUint16();
	this.hdr_size += 8;
}

BoxParser.SampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.data = stream.readUint8Array(this.size - this.hdr_size);
}

BoxParser.SampleEntry.prototype.parseDataAndRewind = function(stream) {
	this.parseHeader(stream);
	this.data = stream.readUint8Array(this.size - this.hdr_size);
	// restore the header size as if the sample entry header had not been parsed
	this.hdr_size -= 8;
	// rewinding
	stream.position -= this.size-this.hdr_size;
}

BoxParser.SampleEntry.prototype.parseFooter = function(stream) {
	var ret;
	var box;
	while (stream.getPosition() < this.start+this.size) {
		ret = BoxParser.parseOneBox(stream, false, this.size - (stream.getPosition() - this.start));
		if (ret.code === BoxParser.OK) {
			box = ret.box;
            if (box) {
                this.boxes.push(box);
                this[box.type] = box;
            } else {
                // encountered terminator box
                stream.position = this.start + this.size;
            }
		} else {
			return;
		}
	}	
}

BoxParser.VisualSampleEntry.prototype.parse = function(stream) {
	var compressorname_length;
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
	compressorname_length = Math.min(31, stream.readUint8());
	this.compressorname = stream.readString(compressorname_length);
	if (compressorname_length < 31) {
		stream.readString(31 - compressorname_length);
	}
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


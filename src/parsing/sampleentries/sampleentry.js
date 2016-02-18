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
	stream.readUint32Array(2);
	this.channel_count = stream.readUint16();
	this.samplesize = stream.readUint16();
	stream.readUint16();
	stream.readUint16();
	this.samplerate = (stream.readUint32()/(1<<16));
	this.parseFooter(stream);
}


BoxParser.SampleEntry.prototype.writeHeader = function(stream) {
	this.size = 8;
	BoxParser.Box.prototype.writeHeader.call(this, stream);
	stream.writeUint8(0);
	stream.writeUint8(0);
	stream.writeUint8(0);
	stream.writeUint8(0);
	stream.writeUint8(0);
	stream.writeUint8(0);
	stream.writeUint16(this.data_reference_index);
}

BoxParser.SampleEntry.prototype.writeFooter = function(stream) {
	for (var i=0; i<this.boxes.length; i++) {
		this.boxes[i].write(stream);
		this.size += this.boxes[i].size;
	}
	Log.debug("BoxWriter", "Adjusting box "+this.type+" with new size "+this.size);
	stream.adjustUint32(this.sizePosition, this.size);	
}

BoxParser.SampleEntry.prototype.write = function(stream) {
	this.writeHeader(stream);
	this.writeFooter(stream);
}

BoxParser.VisualSampleEntry.prototype.write = function(stream) {
	this.writeHeader(stream);
	this.size += 2*7+6*4+32;
	stream.writeUint16(0); 
	stream.writeUint16(0);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint16(this.width);
	stream.writeUint16(this.height);
	stream.writeUint32(this.horizresolution);
	stream.writeUint32(this.vertresolution);
	stream.writeUint32(0);
	stream.writeUint16(this.frame_count);
	stream.writeString(this.compressorname, null, 32);
	stream.writeUint16(this.depth);
	stream.writeInt16(-1);
	this.writeFooter(stream);
}

BoxParser.AudioSampleEntry.prototype.write = function(stream) {
	this.writeHeader(stream);
    this.size += 2+2+4;
    stream.writeUint16(this.version);
    stream.writeUint16(this.revision);
	stream.writeUint32(this.vendor);
    if (!this.version) { // version == 0
        this.size += 2*4+4;
        stream.writeUint16(this.channel_count);
        stream.writeUint16(this.samplesize);
        stream.writeUint16(0);
        stream.writeUint16(0);
        stream.writeUint32(this.samplerate<<16);
    } else if (this.version == 1) {
        this.size += 2*4+4*5;
        stream.writeUint16(this.channel_count);
        stream.writeUint16(this.samplesize);
        stream.writeInt16(this.compressionId);
        stream.writeUint16(this.packetSize);
        stream.writeUint32(this.samplerate<<16);
        stream.writeUint32(this.samplesPerPacket);
        stream.writeUint32(this.bytesPerPacket);
        stream.writeUint32(this.bytesPerFrame);
        stream.writeUint32(this.bytesPerSample);
    }
	this.writeFooter(stream);
}

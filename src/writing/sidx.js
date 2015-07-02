BoxParser.sidxBox.prototype.write = function(stream) {
	this.version = 0;	
	this.flags = 0;
	this.size = 4*4+2+2+12*this.references.length;
	this.writeHeader(stream);
	stream.writeUint32(this.reference_ID);
	stream.writeUint32(this.timescale);
	stream.writeUint32(this.earliest_presentation_time);
	stream.writeUint32(this.first_offset);
	stream.writeUint16(0);
	stream.writeUint16(this.references.length);
	for (var i = 0; i < this.references.length; i++) {
		var ref = this.references[i];
		stream.writeUint32(ref.reference_type << 31 | ref.referenced_size);
		stream.writeUint32(ref.subsegment_duration);
		stream.writeUint32(ref.starts_with_SAP << 31 | ref.SAP_type << 28 | ref.SAP_delta_time);
	}
}


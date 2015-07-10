BoxParser.emsgBox.prototype.write = function(stream) {
	this.version = 0;	
	this.flags = 0;
	this.size = 4*4+this.message_data.length+(this.scheme_id_uri.length+1)+(this.value.length+1);
	this.writeHeader(stream);
	stream.writeCString(this.scheme_id_uri);
	stream.writeCString(this.value);
	stream.writeUint32(this.timescale);
	stream.writeUint32(this.presentation_time_delta);
	stream.writeUint32(this.event_duration);
	stream.writeUint32(this.id);
	stream.writeUint8Array(this.message_data);
}


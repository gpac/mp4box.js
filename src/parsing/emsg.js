BoxParser.createFullBoxCtor("emsg", function(stream) {
	this.scheme_id_uri 				= stream.readCString();
	this.value 						= stream.readCString();
	this.timescale 					= stream.readUint32();
	this.presentation_time_delta 	= stream.readUint32();
	this.event_duration			 	= stream.readUint32();
	this.id 						= stream.readUint32();
	var message_size = this.size - this.hdr_size - (4*4 + (this.scheme_id_uri.length+1) + (this.value.length+1));
	this.message_data = stream.readUint8Array(message_size);
});


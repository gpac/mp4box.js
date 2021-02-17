BoxParser.createFullBoxCtor("auxC", function(stream) {
	this.aux_type = stream.readCString();
	var aux_subtype_length = this.size - this.hdr_size - (this.aux_type.length + 1);
	this.aux_subtype = stream.readUint8Array(aux_subtype_length);
});
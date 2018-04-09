BoxParser.createSampleGroupCtor("alst", function(stream) {
	var i;
	var roll_count = stream.readUint16();
	this.first_output_sample = stream.readUint16();
	this.sample_offset = [];
	for (i = 0; i < roll_count; i++) {
		this.sample_offset[i] = stream.readUint32();
	}
	var remaining = this.description_length - 4 - 4*roll_count;
	this.num_output_samples = [];
	this.num_total_samples = [];
	for (i = 0; i < remaining/4; i++) {
		this.num_output_samples[i] = stream.readUint16();
		this.num_total_samples[i] = stream.readUint16();
	}
});


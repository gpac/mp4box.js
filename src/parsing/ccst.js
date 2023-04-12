BoxParser.createFullBoxCtor("ccst", function(stream) {
	var flags = stream.readUint8();
	this.all_ref_pics_intra = ((flags & 0x80) == 0x80);
	this.intra_pred_used = ((flags & 0x40) == 0x40);
	this.max_ref_per_pic = ((flags & 0x3f) >> 2);
	stream.readUint24();
});


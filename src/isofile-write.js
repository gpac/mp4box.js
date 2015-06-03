/* Rewrite the entire file */
ISOFile.prototype.write = function(outstream) {
	for (var i=0; i<this.boxes.length; i++) {
		this.boxes[i].write(outstream);
	}
}

/* Modify the file and create the initialization segment */
ISOFile.prototype.writeInitializationSegment = function(outstream) {
	var i;
	var index;
	var mehd;
	var trex;
	var box;
	Log.d("ISOFile", "Generating initialization segment");
	/* write the ftyp box as is in the input, may need to be fixed for DASH brands ?*/
	this.ftyp.write(outstream);

	/* The input file may be fragmented and have an mvex box, we just retrieve the duration and delele that box  */
	if (this.moov.mvex) {
		this.initial_duration = this.moov.mvex.mehd.fragment_duration;
		/* find this mvex box in the array of boxes and remove it */
		index = -1;
		for (i = 0; i < this.moov.boxes.length; i++) {
			box = this.moov.boxes[i];
			if (box === this.moov.mvex) {
				index = i;
			}
		}
		if (index > -1) {
			this.moov.boxes.splice(index, 1);
		}
		this.moov.mvex = null;
	}
	/* we can now create the new mvex box */
	this.moov.mvex = new BoxParser.mvexBox();
	this.moov.boxes.push(this.moov.mvex);
	this.moov.mvex.mehd = new BoxParser.mehdBox();
	this.moov.mvex.boxes.push(this.moov.mvex.mehd);
	this.moov.mvex.mehd.fragment_duration = this.initial_duration; // restore the same duration
	for (i = 0; i < this.moov.traks.length; i++) {
		if (this.moov.traks[i].ignore) continue;
		trex = new BoxParser.trexBox();
		this.moov.mvex.boxes.push(trex);
		trex.track_id = this.moov.traks[i].tkhd.track_id;
		trex.default_sample_description_index = 1;
		trex.default_sample_duration = (this.moov.traks[i].samples.length>0 ? this.moov.traks[i].samples[0].duration: 0);
		trex.default_sample_size = 0;
		trex.default_sample_flags = 1<<16;
	}
	this.moov.write(outstream);
}

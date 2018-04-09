BoxParser.createFullBoxCtor("subs", function(stream) {
	var i,j;
	var entry_count;
	var subsample_count;
	entry_count = stream.readUint32();
	this.entries = [];
	for (i = 0; i < entry_count; i++) {
		var sampleInfo = {};
		this.entries[i] = sampleInfo;
		sampleInfo.sample_delta = stream.readUint32();
		sampleInfo.subsamples = [];
		subsample_count = stream.readUint16();
		if (subsample_count>0) {
			for (j = 0; j < subsample_count; j++) {
				var subsample = {};
				sampleInfo.subsamples.push(subsample);
				if (this.version == 1) {
					subsample.size = stream.readUint32();
				} else {
					subsample.size = stream.readUint16();
				}
				subsample.priority = stream.readUint8();
				subsample.discardable = stream.readUint8();
				subsample.codec_specific_parameters = stream.readUint32();
			}
		}
	}
});


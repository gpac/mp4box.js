ISOFile.prototype.add = BoxParser.Box.prototype.add;

ISOFile.prototype.init = function () {
	var moov = this.add("moov");
	moov.add("mvhd").set("timescale",600)
					.set("rate", 1)
					.set("creation_time", 0)
					.set("modification_time", 0)
					.set("duration", 0)
					.set("volume", 1)
					.set("matrix", [ 0, 0, 0, 0, 0, 0, 0, 0, 0])
					.set("next_track_id", 1);
	moov.add("mvex");
	return this;
}

ISOFile.prototype.addTrack = function (_options) {
	if (!this.moov) {
		this.init();
	}

	var options = _options || {}; 
	options.width = options.width || 320;
	options.height = options.height || 320;
	options.id = options.id || this.moov.mvhd.next_track_id;
	options.type = options.type || "avc1";

	var trak = this.moov.add("trak");
	this.moov.mvhd.next_track_id = options.id+1;
	trak.add("tkhd").set("creation_time",0)
					.set("modification_time", 0)
					.set("track_id", options.id)
					.set("duration", 0)
					.set("layer", 0)
					.set("alternate_group", 0)
					.set("volume", 1)
					.set("matrix", [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ])
					.set("width", options.width)
					.set("height", options.height);

	var mdia = trak.add("mdia");
	mdia.add("mdhd").set("creation_time", 0)
					.set("modification_time", 0)
					.set("timescale", options.timescale || 1)
					.set("duration", 0)
					.set("language", options.language || 0);

	mdia.add("hdlr").set("handler", options.hdlr || "vide")
					.set("name", options.name || "Track created with MP4Box.js");

	mdia.add("elng").set("extended_language", options.language || "fr-FR");

	var minf = mdia.add("minf");
	var sample_entry = new BoxParser[options.type+"SampleEntry"]();
	var media_type = "";
	for (var i = 0; i < BoxParser.sampleEntryCodes.length; i++) {
		var code = BoxParser.sampleEntryCodes[i];
		if (code.types.indexOf(options.type) > -1) {
			media_type = code.prefix;
			break;
		}
	}
	switch(media_type) {
		case "Visual":
			minf.add("vmhd").set("graphicsmode",0).set("opcolor", [ 0, 0, 0 ]);
			sample_entry.set("width", options.width)
						.set("height", options.height)
						.set("horizresolution", 0x48<<16)
						.set("vertresolution", 0x48<<16)
						.set("frame_count", 1)
						.set("compressorname", options.type+" Compressor")
						.set("depth", 0x18);
			sample_entry.add("avcC").set("SPS", [])
									.set("PPS", [])
									.set("configurationVersion", 0)
									.set("AVCProfileIndication",0)
									.set("profile_compatibility", 0)
									.set("AVCLevelIndication" ,0)
									.set("lengthSizeMinusOne", 0);
			break;
		case "Audio":
			minf.add("smhd");
			break;
		case "Hint":
			minf.add("hmhd");
			break;
		case "Subtitle":
			minf.add("sthd");
			break;
		case "Metadata":
			minf.add("nmhd");
			break;
		case "System":
			minf.add("nmhd");
			break;
		default:
			minf.add("nmhd");
			break;
	}
	minf.add("dinf").add("dref").addEntry((new BoxParser["url Box"]()).set("flags", 0x1));
	var stbl = minf.add("stbl");
	stbl.add("stsd").addEntry(sample_entry);
	stbl.add("stts").set("sample_counts", [])
					.set("sample_deltas", []);
	stbl.add("stsc").set("first_chunk", [])
					.set("samples_per_chunk", [])
					.set("sample_description_index", []);

	this.moov.mvex.add("trex").set("track_id", options.id)
							  .set("default_sample_description_index", options.default_sample_description_index || 1)
							  .set("default_sample_duration", options.default_sample_duration || 0)
							  .set("default_sample_size", options.default_sample_size || 0)
							  .set("default_sample_flags", options.default_sample_flags || 0);
	this.buildTrakSampleLists(trak);
	return trak;
}

BoxParser.Box.prototype.computeSize = function() {
	var stream = stream_ || new DataStream();
	stream.endianness = DataStream.BIG_ENDIAN;
	this.write(stream);
}

ISOFile.prototype.addSample = function (trak, data, _options) {
	var options = _options || {};
	var sample = {};
    sample.number = trak.samples.length;
	sample.track_id = trak.tkhd.track_id;
	sample.timescale = trak.mdia.mdhd.timescale;
	sample.description_index = (options.sample_description_index ? options.sample_description_index - 1: 0);
	sample.description = trak.mdia.minf.stbl.stsd.entries[sample.description_index];
	sample.data = data;
	sample.size = data.bytesLength;
	trak.samples_size += sample.size;
	sample.duration = options.duration || 1;
	trak.samples_duration += sample.duration;
	sample.cts = options.cts || 0;
	sample.dts = options.dts || 0;
	sample.is_sync = options.is_sync || false;
	sample.is_leading = options.is_leading || 0;
	sample.depends_on = options.depends_on || 0;
	sample.is_depended_on = options.is_depended_on || 0;
	sample.has_redundancy = options.has_redundancy || 0;
	sample.degradation_priority = options.degradation_priority || 0;
	sample.offset = 0;
	sample.subsamples = options.subsamples;
	this.processSamples();
	
	//var moof = ISOFile.createSingleSampleMoof(sample);
	//this.moofs.push(moof);
	//this.boxes.push(moof);
	//moof.computeSize();
	///* adjusting the data_offset now that the moof size is known*/
	//moof.trafs[0].truns[0].data_offset = moof.size+8; //8 is mdat header
	//this.add("mdat").data = data;
}

ISOFile.createSingleSampleMoof = function(sample) {
	var moof = new BoxParser.moofBox();
	moof.add("mfhd").set("sequence_number", this.nextMoofNumber);
	this.nextMoofNumber++;
	var traf = moof.add("traf");
	traf.add("tfhd").set("track_id", sample.track_id)
					.set("flags", BoxParser.TFHD_FLAG_DEFAULT_BASE_IS_MOOF);
	traf.add("tfdt").set("baseMediaDecodeTime", sample.dts);
	traf.add("trun").set("flags", BoxParser.TRUN_FLAGS_DATA_OFFSET | BoxParser.TRUN_FLAGS_DURATION | 
				 				  BoxParser.TRUN_FLAGS_SIZE | BoxParser.TRUN_FLAGS_FLAGS | 
				 				  BoxParser.TRUN_FLAGS_CTS_OFFSET)
					.set("data_offset",0)
					.set("first_sample_flags",0)
					.set("sample_count",1)
					.set("sample_duration",[sample.duration])
					.set("sample_size",[sample.size])
					.set("sample_flags",[0])
					.set("sample_composition_time_offset", [sample.cts - sample.dts]);
	return moof;
}


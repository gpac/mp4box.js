ISOFile.prototype.add = BoxParser.Box.prototype.add;
ISOFile.prototype.addBox = BoxParser.Box.prototype.addBox;

ISOFile.prototype.init = function (_options) {
	var options = _options || {}; 
	var ftyp = this.add("ftyp").set("major_brand", (options.brands && options.brands[0]) || "iso4")
							   .set("minor_version", 0)
							   .set("compatible_brands", options.brands || ["iso4"]);
	var moov = this.add("moov");
	moov.add("mvhd").set("timescale", options.timescale || 600)
					.set("rate", options.rate || 1<<16)
					.set("creation_time", 0)
					.set("modification_time", 0)
					.set("duration", options.duration || 0)
					.set("volume", (options.width) ? 0 : 0x0100)
					.set("matrix", [ 1<<16, 0, 0, 0, 1<<16, 0, 0, 0, 0x40000000])
					.set("next_track_id", 1);
	moov.add("mvex");
	return this;
}

ISOFile.prototype.addTrack = function (_options) {
	if (!this.moov) {
		this.init(_options);
	}

	var options = _options || {}; 
	options.width = options.width || 320;
	options.height = options.height || 320;
	options.id = options.id || this.moov.mvhd.next_track_id;
	options.type = options.type || "avc1";

	var trak = this.moov.add("trak");
	this.moov.mvhd.next_track_id = options.id+1;
	trak.add("tkhd").set("flags",BoxParser.TKHD_FLAG_ENABLED | 
								 BoxParser.TKHD_FLAG_IN_MOVIE | 
								 BoxParser.TKHD_FLAG_IN_PREVIEW)
					.set("creation_time",0)
					.set("modification_time", 0)
					.set("track_id", options.id)
					.set("duration", options.duration || 0)
					.set("layer", options.layer || 0)
					.set("alternate_group", 0)
					.set("volume", 1)
					.set("matrix", [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ])
					.set("width", options.width)
					.set("height", options.height);

	var mdia = trak.add("mdia");
	mdia.add("mdhd").set("creation_time", 0)
					.set("modification_time", 0)
					.set("timescale", options.timescale || 1)
					.set("duration", options.media_duration || 0)
					.set("language", options.language || "und");

	mdia.add("hdlr").set("handler", options.hdlr || "vide")
					.set("name", options.name || "Track created with MP4Box.js");

	mdia.add("elng").set("extended_language", options.language || "fr-FR");

	var minf = mdia.add("minf");
	if (BoxParser[options.type+"SampleEntry"] === undefined) return;
	var sample_description_entry = new BoxParser[options.type+"SampleEntry"]();
	sample_description_entry.data_reference_index = 1;
	var media_type = "";
	for (var mediaType in BoxParser.sampleEntryCodes) {
		var codes = BoxParser.sampleEntryCodes[mediaType];
		for (var i = 0; i < codes.length; i++) {
			if (codes.indexOf(options.type) > -1) {
				media_type = mediaType;
				break;
			}
		}
	}
	switch(media_type) {
		case "Visual":
			minf.add("vmhd").set("graphicsmode",0).set("opcolor", [ 0, 0, 0 ]);
			sample_description_entry.set("width", options.width)
						.set("height", options.height)
						.set("horizresolution", 0x48<<16)
						.set("vertresolution", 0x48<<16)
						.set("frame_count", 1)
						.set("compressorname", options.type+" Compressor")
						.set("depth", 0x18);
			if (options.avcDecoderConfigRecord) {
				var avcC = new BoxParser.avcCBox();
				var stream = new MP4BoxStream(options.avcDecoderConfigRecord);
				avcC.parse(stream);
				sample_description_entry.addBox(avcC);
			}
			break;
		case "Audio":
			minf.add("smhd").set("balance", options.balance || 0);
			sample_description_entry.set("channel_count", options.channel_count || 2)
						.set("samplesize", options.samplesize || 16)
						.set("samplerate", options.samplerate || 1<<16);
			break;
		case "Hint":
			minf.add("hmhd"); // TODO: add properties
			break;
		case "Subtitle":
			minf.add("sthd");
			switch (options.type) {
				case "stpp":
					sample_description_entry.set("namespace", options.namespace || "nonamespace")
								.set("schema_location", options.schema_location || "")
								.set("auxiliary_mime_types", options.auxiliary_mime_types || "");
					break;
			}
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
	if (options.description) {
		sample_description_entry.addBox(options.description);
	}
	if (options.description_boxes) {
		options.description_boxes.forEach(function (b) {
			sample_description_entry.addBox(b);
		});
	}
	minf.add("dinf").add("dref").addEntry((new BoxParser["url Box"]()).set("flags", 0x1));
	var stbl = minf.add("stbl");
	stbl.add("stsd").addEntry(sample_description_entry);
	stbl.add("stts").set("sample_counts", [])
					.set("sample_deltas", []);
	stbl.add("stsc").set("first_chunk", [])
					.set("samples_per_chunk", [])
					.set("sample_description_index", []);
	stbl.add("stco").set("chunk_offsets", []);
	stbl.add("stsz").set("sample_sizes", []);

	this.moov.mvex.add("trex").set("track_id", options.id)
							  .set("default_sample_description_index", options.default_sample_description_index || 1)
							  .set("default_sample_duration", options.default_sample_duration || 0)
							  .set("default_sample_size", options.default_sample_size || 0)
							  .set("default_sample_flags", options.default_sample_flags || 0);
	this.buildTrakSampleLists(trak);
	return options.id;
}

BoxParser.Box.prototype.computeSize = function(stream_) {
	var stream = stream_ || new DataStream();
	stream.endianness = DataStream.BIG_ENDIAN;
	this.write(stream);
}

ISOFile.prototype.addSample = function (track_id, data, _options) {
	var options = _options || {};
	var sample = {};
	var trak = this.getTrackById(track_id);
	if (trak === null) return;
    sample.number = trak.samples.length;
	sample.track_id = trak.tkhd.track_id;
	sample.timescale = trak.mdia.mdhd.timescale;
	sample.description_index = (options.sample_description_index ? options.sample_description_index - 1: 0);
	sample.description = trak.mdia.minf.stbl.stsd.entries[sample.description_index];
	sample.data = data;
	sample.size = data.byteLength;
	sample.alreadyRead = sample.size;
	sample.duration = options.duration || 1;
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
	trak.samples.push(sample);
	trak.samples_size += sample.size;
	trak.samples_duration += sample.duration;
	if (!trak.first_dts) {
		trak.first_dts = options.dts;
	}

	this.processSamples();
	
	var moof = this.createSingleSampleMoof(sample);
	this.addBox(moof);
	moof.computeSize();
	/* adjusting the data_offset now that the moof size is known*/
	moof.trafs[0].truns[0].data_offset = moof.size+8; //8 is mdat header
	this.add("mdat").data = new Uint8Array(data);
	return sample;
}

ISOFile.prototype.createSingleSampleMoof = function(sample) {
	var sample_flags = 0;
	if (sample.is_sync)
		sample_flags = (1 << 25);  // sample_depends_on_none (I picture)
	else
		sample_flags = (1 << 16);  // non-sync

	var moof = new BoxParser.moofBox();
	moof.add("mfhd").set("sequence_number", this.nextMoofNumber);
	this.nextMoofNumber++;
	var traf = moof.add("traf");
	var trak = this.getTrackById(sample.track_id);
	traf.add("tfhd").set("track_id", sample.track_id)
					.set("flags", BoxParser.TFHD_FLAG_DEFAULT_BASE_IS_MOOF);
	traf.add("tfdt").set("baseMediaDecodeTime", (sample.dts - trak.first_dts));
	traf.add("trun").set("flags", BoxParser.TRUN_FLAGS_DATA_OFFSET | BoxParser.TRUN_FLAGS_DURATION | 
				 				  BoxParser.TRUN_FLAGS_SIZE | BoxParser.TRUN_FLAGS_FLAGS | 
				 				  BoxParser.TRUN_FLAGS_CTS_OFFSET)
					.set("data_offset",0)
					.set("first_sample_flags",0)
					.set("sample_count",1)
					.set("sample_duration",[sample.duration])
					.set("sample_size",[sample.size])
					.set("sample_flags",[sample_flags])
					.set("sample_composition_time_offset", [sample.cts - sample.dts]);
	return moof;
}


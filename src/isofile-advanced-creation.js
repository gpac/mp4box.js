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
	var stbl = mdia.add("stbl");
	stbl.add("stsd").addEntry(sample_entry);
	stbl.add("stts").set("sample_counts", [])
					.set("sample_deltas", []);
	stbl.add("stsc").set("first_chunk", [])
					.set("samples_per_chunk", [])
					.set("sample_description_index", []);

	this.moov.mvex.add("trex").set("track_id", options.id)
							  .set("default_sample_description_index", options.default_sample_description_index || 0)
							  .set("default_sample_duration", options.default_sample_duration || 0)
							  .set("default_sample_size", options.default_sample_size || 0)
							  .set("default_sample_flags", options.default_sample_flags || 0);
	return trak;
}

ISOFile.prototype.getBuffer = function() {
	var stream = new DataStream();
	stream.endianness = DataStream.BIG_ENDIAN;
	this.write(stream);
	return stream.buffer;
}

ISOFile.prototype.addSample = function (trak, data, options) {
	
}
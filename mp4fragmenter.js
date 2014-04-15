var mp4boxParser = {
	boxes : [ "mdat", 
			  "avcC",
			  "vmhd", "smhd", "hmhd", "dref", "elst" // full boxes not yet parsed
			],
	fullBoxes : [ "mvhd", "tkhd", "mdhd", "hdlr", "smhd", "hmhd", "nhmd", "url ", "urn ", /*stsd: special case */,
				  "ctts", "cslg", "stco", "co64", "stsc", "stss", "stsz", "stz2", "stts", "stsh", 
				  "mehd", "trex", "mfhd", "tfhd", "trun", "tfdt",
				  "esds"
				],
	containerBoxes : [ 
		[ "moov", [ "trak" ] ],
		[ "trak" ],
		[ "edts" ],
		[ "mdia" ],
		[ "minf" ],
		[ "dinf" ],
		[ "stbl" ],
		[ "mvex" ],
		[ "moof", [ "traf" ] ],
		[ "traf", [ "trun" ] ],
	],
	sampleEntries : [ 
		{ prefix: "Visual", types: [ "mp4v", "avc1", "avc2", "avc3", "avc4" ] },
		{ prefix: "Audio", 	types: [ "mp4a" ] },
		{ prefix: "", 		types: [ "metx", "mett", "urim" ] }
	],
	initialize: function() {
		var i, j;
		var length;
		mp4boxParser.FullBox.prototype = new mp4boxParser.Box();
		mp4boxParser.basicContainerBox.prototype = new mp4boxParser.Box();
		mp4boxParser.stsdBox.prototype = new mp4boxParser.FullBox();
		mp4boxParser.SampleEntry.prototype = new mp4boxParser.FullBox();
		mp4boxParser.VisualSampleEntry.prototype = new mp4boxParser.SampleEntry();
		mp4boxParser.AudioSampleEntry.prototype = new mp4boxParser.SampleEntry();
		/* creating constructors for simple boxes */
		length = mp4boxParser.boxes.length;
		for (i=0; i<length; i++) {
			mp4boxParser[mp4boxParser.boxes[i]+"Box"] = (function (j) { /* creating a closure around the iterating value of i */
				return function(size) {
					mp4boxParser.Box.call(this, mp4boxParser.boxes[j], size);
				}
			})(i);
			mp4boxParser[mp4boxParser.boxes[i]+"Box"].prototype = new mp4boxParser.Box();
		}
		/* creating constructors for full boxes */
		length = mp4boxParser.fullBoxes.length;
		for (i=0; i<length; i++) {
			mp4boxParser[mp4boxParser.fullBoxes[i]+"Box"] = (function (j) { 
				return function(size) {
					mp4boxParser.FullBox.call(this, mp4boxParser.fullBoxes[j], size);
				}
			})(i);
			mp4boxParser[mp4boxParser.fullBoxes[i]+"Box"].prototype = new mp4boxParser.FullBox();
		}
		/* creating constructors for basic container boxes */
		length = mp4boxParser.containerBoxes.length;
		for (i=0; i<length; i++) {
			mp4boxParser[mp4boxParser.containerBoxes[i][0]+"Box"] = (function (j, subBoxNames) { 
				return function(size) {
					mp4boxParser.basicContainerBox.call(this, mp4boxParser.containerBoxes[j][0], size);
					if (subBoxNames) {
						this.subBoxNames = subBoxNames;
						var nbSubBoxes = subBoxNames.length;
						for (var k = 0; k<nbSubBoxes; k++) {
							this[subBoxNames[k]+"s"] = new Array();
						}
					}
				}
			})(i, mp4boxParser.containerBoxes[i][1]);
			mp4boxParser[mp4boxParser.containerBoxes[i][0]+"Box"].prototype = new mp4boxParser.basicContainerBox();
		}
		/* creating constructors for stsd entries  */
		length = mp4boxParser.sampleEntries.length;
		for (j = 0; j < length; j++) {
			var prefix = mp4boxParser.sampleEntries[j].prefix;
			var types = mp4boxParser.sampleEntries[j].types;
			var nb_types = types.length;
			for (i=0; i<nb_types; i++) {
				mp4boxParser[types[i]+"Box"] = (function (k, l) { 
					return function(size) {
						mp4boxParser[mp4boxParser.sampleEntries[k].prefix+"SampleEntry"].call(this, mp4boxParser.sampleEntries[k].types[l], size);
					}
				})(j, i);
				mp4boxParser[types[i]+"Box"].prototype = new mp4boxParser[prefix+"SampleEntry"]();
			}
		}

	},
	ISOFile: function() {
		this.boxes = new Array();
		this.mdats = new Array();
		this.moofs = new Array();
	},
	Box: function(_type, _size) {
		this.type = _type;
		this.size = _size;
	},
	FullBox: function(type, size) {
		mp4boxParser.Box.call(this, type, size);
		this.flags = 0;
		this.version = 0;
	},
	basicContainerBox: function(type, size) {
		mp4boxParser.Box.call(this, type, size);
		this.boxes = new Array();
	},
	SampleEntry: function(type, size) {
		mp4boxParser.Box.call(this, type, size);	
		this.boxes = new Array();
	},
	VisualSampleEntry: function(type, size) {
		mp4boxParser.SampleEntry.call(this, type, size);	
	},
	AudioSampleEntry: function(type, size) {
		mp4boxParser.SampleEntry.call(this, type, size);	
	},
	NOT_ENOUGH_DATA: 0,
	LOG_LEVEL_ERROR: 4,
	LOG_LEVEL_WARNING: 3,
	LOG_LEVEL_INFO: 2,
	LOG_LEVEL_DEBUG: 1,
	log_level: 2,
	log: function(level, msg) {
		if (level >= mp4boxParser.log_level) {
			console.log("[MP4Box] "+msg);
		}
	},
	stsdBox: function(size) {
		mp4boxParser.FullBox.call(this, "stsd", size);
		this.entries = new Array();
	},
	parseOneBox: function(stream) {
		var box;
		var start = stream.position;
		var hdr_size = 0;
		if (stream.byteLength < 8) {
			return mp4boxParser.NOT_ENOUGH_DATA;
		}
		var size = stream.readUint32();
		var type = stream.readString(4);
		mp4boxParser.log(mp4boxParser.LOG_LEVEL_DEBUG, "Found box of type "+type+" and size "+size+" at position "+stream.position);
		hdr_size = 8;
		if (type == "uuid") {
			/* TODO */
			throw "UUID not supported";
		}
		if (size == 1) {
			size = stream.readUint64();
			hdr_size += 8;
		} else if (size == 0) {
			/* box extends till the end of file */
		}
		
		if (size - hdr_size > stream.byteLength ) {
			stream.seek(start);
			return mp4boxParser.NOT_ENOUGH_DATA;
		}
		if (mp4boxParser[type+"Box"]) {
			box = new mp4boxParser[type+"Box"](size - hdr_size);		
		} else {
			box = new mp4boxParser.Box(type, size - hdr_size);
		}
		/* recording the position of the box in the input stream */
		box.inputStart = start;
		box.parse(stream);
		return box;
	},
}

mp4boxParser.initialize();

mp4boxParser.Box.prototype.parse = function(stream) {
	this.data = stream.readUint8Array(this.size);
}

mp4boxParser.FullBox.prototype.parseFullHeader = function (stream) {
	this.version = stream.readUint8();
	this.flags = stream.readUint24();
	this.size -= 4;
}

mp4boxParser.basicContainerBox.prototype.parse = function(stream) {
	var box;
	var start;
	start = stream.position;
	while (stream.position < start+this.size) {
		box = mp4boxParser.parseOneBox(stream);
		/* store the box in the 'boxes' array to preserve box order (for offset) but also store box in a property for more direct access */
		this.boxes.push(box);
		if (this.subBoxNames && this.subBoxNames.indexOf(box.type) != -1) {
			this[this.subBoxNames+"s"].push(box);
		} else {
			this[box.type] = box;
		}
	}
}

mp4boxParser.SampleEntry.prototype.getCodec = function() {
	return this.type;
}

mp4boxParser.SampleEntry.prototype.parseHeader = function(stream) {
	this.start = stream.position;
	stream.readUint8Array(6);
	this.data_reference_index = stream.readUint16();
}

mp4boxParser.SampleEntry.prototype.parseFooter = function(stream) {
	while (stream.position < this.start+this.size) {
		box = mp4boxParser.parseOneBox(stream);
		this.boxes.push(box);
		this[box.type] = box;
	}	
}

mp4boxParser.SampleEntry.prototype.parse = function(stream) {
	this.parserHeader(stream);
	this.parseFooter(stream);
}

mp4boxParser.VisualSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	stream.readUint16(); 
	stream.readUint16();
	stream.readUint32Array(3);
	this.width = stream.readUint16();
	this.height = stream.readUint16();
	this.horizresolution = stream.readUint32();
	this.vertresolution = stream.readUint32();
	stream.readUint32();
	this.frame_count = stream.readUint16();
	this.compressorname = stream.readString(32);
	this.depth = stream.readUint16();
	stream.readUint16();
	this.parseFooter(stream);
}

mp4boxParser.AudioSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	stream.readUint32Array(2);
	this.channel_count = stream.readUint16();
	this.samplesize = stream.readUint16();
	stream.readUint16();
	stream.readUint16();
	this.samplerate = (stream.readUint32()>>16);
	this.parseFooter(stream);
}

mp4boxParser.mvhdBox.prototype.parse = function(stream) {
	this.flags = 0;
	this.parseFullHeader(stream);
	if (this.version == 1) {
		this.creation_time = stream.readUint64();
		this.modification_time = stream.readUint64();
		this.timescale = stream.readUint32();
		this.duration = stream.readUint64();
	} else {
		this.creation_time = stream.readUint32();
		this.modification_time = stream.readUint32();
		this.timescale = stream.readUint32();
		this.duration = stream.readUint32();
	}
	this.rate = stream.readUint32();
	this.volume = stream.readUint16();
	stream.readUint16();
	stream.readUint32Array(2);
	this.matrix = stream.readUint32Array(9);
	stream.readUint32Array(6);
	this.next_track_ID = stream.readUint32();
}

mp4boxParser.TKHD_FLAG_ENABLED    = 0x000001;
mp4boxParser.TKHD_FLAG_IN_MOVIE   = 0x000002;
mp4boxParser.TKHD_FLAG_IN_PREVIEW = 0x000004;

mp4boxParser.tkhdBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.version == 1) {
		this.creation_time = stream.readUint64();
		this.modification_time = stream.readUint64();
		this.track_id = stream.readUint32();
		stream.readUint32();
		this.duration = stream.readUint64();
	} else {
		this.creation_time = stream.readUint32();
		this.modification_time = stream.readUint32();
		this.track_id = stream.readUint32();
		stream.readUint32();
		this.duration = stream.readUint32();
	}
	stream.readUint32Array(2);
	this.layer = stream.readUint16();
	this.alternate_group = stream.readUint16();
	this.volume = stream.readUint16();
	stream.readUint16();
	this.matrix = stream.readUint32Array(9);
	this.width = stream.readUint32();
	this.height = stream.readUint32();
}

mp4boxParser.mdhdBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.version == 1) {
		this.creation_time = stream.readUint64();
		this.modification_time = stream.readUint64();
		this.timescale = stream.readUint32();
		this.duration = stream.readUint64();
	} else {
		this.creation_time = stream.readUint32();
		this.modification_time = stream.readUint32();
		this.timescale = stream.readUint32();
		this.duration = stream.readUint32();
	}
	this.language = stream.readUint16();
	stream.readUint16();
}

mp4boxParser.hdlrBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.version == 0) {
		stream.readUint32();
		this.handler = stream.readString(4);
		stream.readUint32Array(3);
		this.name = stream.readCString();
	} else {
		this.data = stream.readUint8Array(size);
	}
}

mp4boxParser.stsdBox.prototype.parse = function(stream) {
	var box;
	var entryCount;
	this.parseFullHeader(stream);
	entryCount = stream.readUint32();
	for (i = 1; i <= entryCount; i++) {
		var box = mp4boxParser.parseOneBox(stream);
		this.entries.push(box);
	}
}

mp4boxParser.SampleEntry.prototype.parse = function(stream) {
	this.parserHeader(stream);
	this.parseFooter(stream);
}

mp4boxParser.avcCBox.prototype.parse = function(stream) {
	var i;
	var nb_nalus;
	var length;
	this.configurationVersion = stream.readUint8();
	this.AVCProfileIndication = stream.readUint8();
	this.profile_compatibility = stream.readUint8();
	this.AVCLevelIndication = stream.readUint8();
	this.lengthSizeMinusOne = (stream.readUint8() & 0x3);
	nb_nalus = (stream.readUint8() & 0x1F);
	this.size -= 6;
	this.SPS = new Array(nb_nalus); 
	for (i = 0; i < nb_nalus; i++) {
		length = stream.readUint16();
		this.SPS[i] = stream.readUint8Array(length);
		this.size -= 2+length;
	}
	nb_nalus = stream.readUint8();
	this.size--;
	this.PPS = new Array(nb_nalus); 
	for (i = 0; i < nb_nalus; i++) {
		length = stream.readUint16();
		this.PPS[i] = stream.readUint8Array(length);
		this.size -= 2+length;
	}
	if (this.size>0) {
		this.ext = stream.readUint8Array(this.size);
	}
}

function decimalToHex(d, padding) {
    var hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
    while (hex.length < padding) {
        hex = "0" + hex;
    }
    return hex;
}

mp4boxParser.avc1Box.prototype.getCodec = function() {
	var baseCodec = mp4boxParser.SampleEntry.prototype.getCodec.call(this);
	if (this.avcC) {
		return baseCodec+"."+decimalToHex(avcC.AVCProfileIndication)+""+decimalToHex(avcC.profile_compatibility)+""+decimalToHex(avcC.AVCLevelIndication);		
	} else {
		return baseCodec;
	}
}

mp4boxParser.mp4aBox.prototype.getCodec = function() {
	var baseCodec = mp4boxParser.SampleEntry.prototype.getCodec.call(this);
	if (this.esds && this.esds.esd) {
		var oti = this.esds.esd.getOTI();
		var dsi = this.esds.esd.getAudioConfig();
		return baseCodec+"."+decimalToHex(oti)+(dsi ? "."+dsi: "");
	} else {
		return baseCodec;
	}
}

mp4boxParser.esdsBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.data = stream.readUint8Array(this.size);
	this.size = 0;
	var esd_parser = new MPEG4DescriptorParser();
	this.esd = esd_parser.parseOneDescriptor(new DataStream(this.data.buffer, 0, DataStream.BIG_ENDIAN));
}

mp4boxParser.cttsBox.prototype.parse = function(stream) {
	var entry_count;
	var i;
	this.parseFullHeader(stream);
	entry_count = stream.readUint32();
	this.sample_counts = new Array();
	this.sample_offsets = new Array();
	if (this.version == 0) {
		for(i=0; i<entry_count; i++) {
			this.sample_counts.push(stream.readUint32());
			this.sample_offsets.push(stream.readUint32());
		}
	} else if (this.version == 1) {
		for(i=0; i<entry_count; i++) {
			this.sample_counts.push(stream.readUint32());
			this.sample_offsets.push(stream.readInt32()); /* signed */
		}
	} else {
		this.data = stream.readUint8Array(this.size-4);
	}
}

mp4boxParser.cttsBox.prototype.unpack = function(samples) {
	var i, j, k;
	k = 0;
	for (i = 0; i < this.sample_counts.length; i++) {
		for (j = 0; j < this.sample_counts[i]; j++) {
			samples[k].pts = samples[k].dts + this.sample_offsets[i];
			k++;
		}
	}
}

mp4boxParser.cslgBox.prototype.parse = function(stream) {
	var entry_count;
	this.parseFullHeader(stream);
	if (this.version == 0) {
		this.compositionToDTSShift = stream.readInt32(); /* signed */
		this.leastDecodeToDisplayDelta = stream.readInt32(); /* signed */
		this.greatestDecodeToDisplayDelta = stream.readInt32(); /* signed */
		this.compositionStartTime = stream.readInt32(); /* signed */
		this.compositionEndTime = stream.readInt32(); /* signed */
	} else {
		this.data = stream.readUint8Array(this.size-4);
	}
}

mp4boxParser.sttsBox.prototype.parse = function(stream) {
	var entry_count;
	var i;
	this.parseFullHeader(stream);
	entry_count = stream.readUint32();
	this.sample_counts = new Array();
	this.sample_deltas = new Array();
	if (this.version == 0) {
		for(i=0; i<entry_count; i++) {
			this.sample_counts.push(stream.readUint32());
			this.sample_deltas.push(stream.readUint32());
		}
	} else {
		this.data = stream.readUint8Array(this.size-4);
	}
}

mp4boxParser.sttsBox.prototype.unpack = function(samples) {
	var i, j, k;
	k = 0;
	for (i = 0; i < this.sample_counts.length; i++) {
		for (j = 0; j < this.sample_counts[i]; j++) {
			if (k == 0) {
				samples[k].dts = 0;
			} else {
				samples[k].dts = samples[k-1].dts + this.sample_deltas[i];
			}
			k++;
		}
	}
}

mp4boxParser.stssBox.prototype.parse = function(stream) {
	var entry_count;
	this.parseFullHeader(stream);
	entry_count = stream.readUint32();
	if (this.version == 0) {
		this.sample_numbers = stream.readUint32Array(entry_count);
	} else {
		this.data = stream.readUint8Array(this.size-4);
	}
}

mp4boxParser.stshBox.prototype.parse = function(stream) {
	var entry_count;
	var i;
	this.parseFullHeader(stream);
	entry_count = stream.readUint32();
	this.shadowed_sample_numbers = new Array();
	this.sync_sample_numbers = new Array();
	if (this.version == 0) {
		for(i=0; i<entry_count; i++) {
			this.shadowed_sample_numbers.push(stream.readUint32());
			this.sync_sample_numbers.push(stream.readUint32());
		}
	} else {
		this.data = stream.readUint8Array(this.size-4);
	}
}

mp4boxParser.stcoBox.prototype.parse = function(stream) {
	var entry_count;
	this.parseFullHeader(stream);
	entry_count = stream.readUint32();
	if (this.version == 0) {
		this.chunk_offsets = stream.readUint32Array(entry_count);
	} else {
		this.data = stream.readUint8Array(this.size-4);
	}
}

mp4boxParser.stcoBox.prototype.unpack = function(samples) {
	var i;
	for (i = 0; i < this.chunk_offsets.length; i++) {
		samples[i].offset = this.chunk_offsets[i];
	}
}

mp4boxParser.co64Box.prototype.parse = function(stream) {
	var entry_count;
	var i;
	this.parseFullHeader(stream);
	entry_count = stream.readUint32();
	this.chunk_offsets = new Array();
	if (this.version == 0) {
		for(i=0; i<entry_count; i++) {
			this.chunk_offsets.push(stream.readUint64());
		}
	} else {
		this.data = stream.readUint8Array(this.size-4);
	}
}

mp4boxParser.stscBox.prototype.parse = function(stream) {
	var entry_count;
	var i;
	this.parseFullHeader(stream);
	entry_count = stream.readUint32();
	this.first_chunk = new Array();
	this.samples_per_chunk = new Array();
	this.sample_description_index = new Array();
	if (this.version == 0) {
		for(i=0; i<entry_count; i++) {
			this.first_chunk.push(stream.readUint32());
			this.samples_per_chunk.push(stream.readUint32());
			this.sample_description_index.push(stream.readUint32());
		}
	} else {
		this.data = stream.readUint8Array(this.size-4);
	}
}

mp4boxParser.stscBox.prototype.unpack = function(samples) {
	var i, j, k, l, m;
	l = 0;
	m = 0;
	for (i = 0; i < this.first_chunk.length; i++) {
		for (j = 0; j < (i+1 < this.first_chunk.length ? this.first_chunk[i+1] : Infinity); j++) {
			m++;
			for (k = 0; k < this.samples_per_chunk[i]; k++) {
				if (samples[l]) {
					samples[l].description_index = this.sample_description_index[i];
					samples[l].chunk_index = m;
				} else {
					return;
				}
				l++;
			}			
		}
	}
}

mp4boxParser.stszBox.prototype.parse = function(stream) {
	var i;
	var sample_size;
	var sample_count;
	this.parseFullHeader(stream);
	this.sample_sizes = new Array();
	if (this.version == 0) {
		sample_size = stream.readUint32();
		sample_count = stream.readUint32();
		if (sample_size == 0) {
			this.sample_sizes = stream.readUint32Array(sample_count);
		} else {
			this.sample_sizes = new Array();
			for (i = 0; i < sample_count; i++) {
				this.sample_sizes[i] = sample_size;
			}		
		}
	} else {
		this.data = stream.readUint8Array(this.size);
	}
}

mp4boxParser.stszBox.prototype.unpack = function(samples) {
	var i;
	for (i = 0; i < this.sample_sizes.length; i++) {
		samples[i].size = this.sample_sizes[i];
	}
}

mp4boxParser.mehdBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.version == 1) {
		this.fragment_duration = stream.readUint64();
	} else {
		this.fragment_duration = stream.readUint32();
	}
}

mp4boxParser.trexBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.track_ID = stream.readUint32();
	this.default_sample_description_index = stream.readUint32();
	this.default_sample_duration = stream.readUint32();
	this.default_sample_size = stream.readUint32();
	this.default_sample_flags = stream.readUint32();
}

mp4boxParser.mfhdBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.sequence_number = stream.readUint32();
}

mp4boxParser.TFHD_FLAG_BASE_DATA_OFFSET		= 0x01;
mp4boxParser.TFHD_FLAG_SAMPLE_DESC			= 0x02;
mp4boxParser.TFHD_FLAG_SAMPLE_DUR			= 0x08;
mp4boxParser.TFHD_FLAG_SAMPLE_SIZE			= 0x10;
mp4boxParser.TFHD_FLAG_SAMPLE_FLAGS			= 0x20;
mp4boxParser.TFHD_FLAG_DUR_EMPTY			= 0x10000;
mp4boxParser.TFHD_FLAG_DEFAULT_BASE_IS_MOOF	= 0x20000;

mp4boxParser.tfhdBox.prototype.parse = function(stream) {
	var readBytes = 0;
	this.parseFullHeader(stream);
	this.track_ID = stream.readUint32();
	if (this.size > readBytes && (this.flags & mp4boxParser.TFHD_FLAG_BASE_DATA_OFFSET)) {
		this.base_data_offset = stream.readUint64();
		readBytes += 8;
	} else {
		this.base_data_offset = 0;
	}
	if (this.size > readBytes && (this.flags & mp4boxParser.TFHD_FLAG_SAMPLE_DESC)) {
		this.default_sample_description_index = stream.readUint32();
		readBytes += 4;
	} else {
		this.default_sample_description_index = 0;
	}
	if (this.size > readBytes && (this.flags & mp4boxParser.TFHD_FLAG_SAMPLE_DUR)) {
		this.default_sample_duration = stream.readUint32();
		readBytes += 4;
	} else {
		this.default_sample_duration = 0;
	}
	if (this.size > readBytes && (this.flags & mp4boxParser.TFHD_FLAG_SAMPLE_SIZE)) {
		this.default_sample_size = stream.readUint32();
		readBytes += 4;
	} else {
		this.default_sample_size = 0;
	}
	if (this.size > readBytes && (this.flags & mp4boxParser.TFHD_FLAG_SAMPLE_FLAGS)) {
		this.default_sample_flags = stream.readUint32();
		readBytes += 4;
	} else {
		this.default_sample_flags = 0;
	}
}

mp4boxParser.TRUN_FLAGS_DATA_OFFSET	= 0x01;
mp4boxParser.TRUN_FLAGS_FIRST_FLAG	= 0x04;
mp4boxParser.TRUN_FLAGS_DURATION	= 0x100;
mp4boxParser.TRUN_FLAGS_SIZE		= 0x200;
mp4boxParser.TRUN_FLAGS_FLAGS		= 0x400;
mp4boxParser.TRUN_FLAGS_CTS_OFFSET	= 0x800;

mp4boxParser.trunBox.prototype.parse = function(stream) {
	var readBytes = 0;
	this.parseFullHeader(stream);
	this.sample_count = stream.readUint32();
	readBytes+= 4;
	if (this.size > readBytes && (this.flags & mp4boxParser.TRUN_FLAGS_DATA_OFFSET) ) {
		this.data_offset = stream.readInt32(); //signed
		readBytes += 4;
	} else {
		this.data_offset = 0;
	}
	if (this.size > readBytes && (this.flags & mp4boxParser.TRUN_FLAGS_FIRST_FLAG) ) {
		this.first_sample_flags = stream.readUint32();
		readBytes += 4;
	} else {
		this.first_sample_flags = 0;
	}
	this.sample_duration = new Array();
	this.sample_size = new Array();
	this.sample_flags = new Array();
	this.sample_composition_time_offset = new Array();
	if (this.size > readBytes) {
		for (var i = 0; i < this.sample_count; i++) {
			if (this.flags & mp4boxParser.TRUN_FLAGS_DURATION) {
				this.sample_duration[i] = stream.readUint32();
			}
			if (this.flags & mp4boxParser.TRUN_FLAGS_SIZE) {
				this.sample_size[i] = stream.readUint32();
			}
			if (this.flags & mp4boxParser.TRUN_FLAGS_FLAGS) {
				this.sample_flags[i] = stream.readUint32();
			}
			if (this.flags & mp4boxParser.TRUN_FLAGS_CTS_OFFSET) {
				if (this.version == 0) {
					this.sample_composition_time_offset[i] = stream.readUint32();
				} else {
					this.sample_composition_time_offset[i] = stream.readInt32(); //signed
				}
			}
		}
	}
}

mp4boxParser.tfdtBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.version == 1) {
		this.baseMediaDecodeTime = stream.readUint64();
	} else {
		this.baseMediaDecodeTime = stream.readUint32();
	}
}

mp4boxParser.ISOFile.prototype.parse = function(stream) {
	var box;
	var err;
	while (!stream.isEof()) {
		box = mp4boxParser.parseOneBox(stream);
		if (box == mp4boxParser.NOT_ENOUGH_DATA) {
			return;
		}
		/* store the box in the 'boxes' array to preserve box order (for offset) but also store box in a property for more direct access */
		this.boxes.push(box);
		switch (box.type) {
			case "mdat":
				this.mdats.push(box);
				break;
			case "moof":
				this.moofs.push(box);
				break;
			default:
				this[box.type] = box;
				break;
		}
	}
}

/* 
   TODO: fix endianness for 24/64-bit fields
   TODO: check range/support for 64-bits numbers in JavaScript
*/
var MAX_SIZE = Math.pow(2, 32);

DataStream.prototype.readUint64 = function () {
	return (this.readUint32()*MAX_SIZE)+this.readUint32();
}

DataStream.prototype.writeUint64 = function (v) {
	var h = Math.floor(v / MAX_SIZE);
	this.writeUint32(h);
	this.writeUint32(v & 0xFFFFFFFF);
}

DataStream.prototype.readUint24 = function () {
	return (this.readUint8()<<16)+(this.readUint8()<<8)+this.readUint8();
}

DataStream.prototype.writeUint24 = function (v) {
	this.writeUint8((v & 0x00FF0000)>>16);
	this.writeUint8((v & 0x0000FF00)>>8);
	this.writeUint8((v & 0x000000FF));
}

DataStream.prototype.adjustUint32 = function(position, value) {
	var pos = this.position;
	this.seek(position);
	this.writeUint32(value);
	this.seek(pos);
}

mp4boxParser.Box.prototype.writeHeader = function(stream, msg) {
	this.size += 8;
	if (this.size > MAX_SIZE) {
		this.size += 8;
	}
	mp4boxParser.log(mp4boxParser.LOG_LEVEL_DEBUG, "writing "+this.type+" size: "+this.size+" at position "+stream.position+(msg || ""));
	if (this.size > MAX_SIZE) {
		stream.writeUint32(1);
	} else {
		this.sizePosition = stream.position;
		stream.writeUint32(this.size);
	}
	stream.writeString(this.type, null, 4);
	if (this.size > MAX_SIZE) {
		stream.writeUint64(this.size);
	} 
}

mp4boxParser.FullBox.prototype.writeHeader = function(stream) {
	this.size += 4;
	mp4boxParser.Box.prototype.writeHeader.call(this, stream, " v="+this.version+" f="+this.flags);
	stream.writeUint8(this.version);
	stream.writeUint24(this.flags);
}

mp4boxParser.Box.prototype.write = function(stream) {
	this.size = this.data.length;
	this.writeHeader(stream);
	if (this.data) {
		stream.writeUint8Array(this.data);
	}
}

mp4boxParser.ISOFile.prototype.write = function(stream) {
	for (var i=0; i<this.boxes.length; i++) {
		this.boxes[i].write(stream);
	}
}

mp4boxParser.ISOFile.prototype.writeInitializationSegment = function(stream) {
	//this.ftyp.write(stream);
	var mvex = new mp4boxParser.mvexBox();
	this.moov.boxes.push(mvex);
	var mehd = new mp4boxParser.mehdBox();
	mvex.boxes.push(mehd);
	mehd.fragment_duration = 0;
	for (var i = 0; i < this.moov.traks.length; i++) {
		var trex = new mp4boxParser.trexBox();
		mvex.boxes.push(trex);
		trex.track_ID = this.moov.traks[i].tkhd.track_id;
		trex.default_sample_description_index = 1;
		trex.default_sample_duration = this.moov.traks[i].samples[0].duration;
		trex.default_sample_size = 0;
		trex.default_sample_flags = 1<<16;
	}
	this.moov.write(stream);
}

mp4boxParser.basicContainerBox.prototype.write = function(stream) {
	this.size = 0;
	this.writeHeader(stream);
	for (var i=0; i<this.boxes.length; i++) {
		if (this.boxes[i]) {
			this.boxes[i].write(stream);
			this.size += this.boxes[i].size;
		}
	}
	/* adjusting the size, now that all sub-boxes are known */
	mp4boxParser.log(mp4boxParser.LOG_LEVEL_DEBUG, "Adjusting box "+this.type+" with new size "+this.size);
	stream.adjustUint32(this.sizePosition, this.size);
}

mp4boxParser.mvhdBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 23*4+2*2;
	this.writeHeader(stream);
	stream.writeUint32(this.creation_time);
	stream.writeUint32(this.modification_time);
	stream.writeUint32(this.timescale);
	stream.writeUint32(this.duration);
	stream.writeUint32(this.rate);
	stream.writeUint16(this.volume);
	stream.writeUint16(0);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint32Array(this.matrix);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint32(this.next_track_ID);
}

mp4boxParser.tkhdBox.prototype.write = function(stream) {
	this.version = 0;
	//this.flags = 0;
	this.size = 4*18+2*4;
	this.writeHeader(stream);
	stream.writeUint32(this.creation_time);
	stream.writeUint32(this.modification_time);
	stream.writeUint32(this.track_id);
	stream.writeUint32(0);
	stream.writeUint32(this.duration);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint16(this.layer);
	stream.writeUint16(this.alternate_group);
	stream.writeUint16(this.volume);
	stream.writeUint16(0);
	stream.writeUint32Array(this.matrix);
	stream.writeUint32(this.width);
	stream.writeUint32(this.height);
}

mp4boxParser.mdhdBox.prototype.write = function(stream) {
	this.size = 4*4+2*2;
	this.flags = 0;
	this.version = 0;
	this.writeHeader(stream);
	stream.writeUint32(this.creation_time);
	stream.writeUint32(this.modification_time);
	stream.writeUint32(this.timescale);
	stream.writeUint32(this.duration);
	stream.writeUint16(this.language);
	stream.writeUint16(0);
}

mp4boxParser.hdlrBox.prototype.write = function(stream) {
	this.size = 5*4+this.name.length+1;
	this.version = 0;
	this.flags = 0;
	this.writeHeader(stream);
	stream.writeUint32(0);
	stream.writeString(this.handler, null, 4);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeCString(this.name);
}

mp4boxParser.stsdBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 0;
	this.size = 0;
	this.writeHeader(stream);
	stream.writeUint32(this.entries.length);
	this.size += 4;
	for (i = 0; i < this.entries.length; i++) {
		this.entries[i].write(stream);
		this.size += this.entries[i].size;
	}
	/* adjusting the size, now that all sub-boxes are known */
	mp4boxParser.log(mp4boxParser.LOG_LEVEL_DEBUG, "Adjusting box "+this.type+" with new size "+this.size);
	stream.adjustUint32(this.sizePosition, this.size);
}

mp4boxParser.SampleEntry.prototype.writeHeader = function(stream) {
	this.size = 8;
	mp4boxParser.Box.prototype.writeHeader.call(this, stream);
	stream.writeUint8(0);
	stream.writeUint8(0);
	stream.writeUint8(0);
	stream.writeUint8(0);
	stream.writeUint8(0);
	stream.writeUint8(0);
	stream.writeUint16(this.data_reference_index);
}

mp4boxParser.SampleEntry.prototype.writeFooter = function(stream) {
	for (var i=0; i<this.boxes.length; i++) {
		this.boxes[i].write(stream);
		this.size += this.boxes[i].size;
	}
	mp4boxParser.log(mp4boxParser.LOG_LEVEL_DEBUG, "Adjusting box "+this.type+" with new size "+this.size);
	stream.adjustUint32(this.sizePosition, this.size);	
}

mp4boxParser.SampleEntry.prototype.write = function(stream) {
	this.writeHeader(stream);
	this.writeFooter(stream);
}

mp4boxParser.VisualSampleEntry.prototype.write = function(stream) {
	this.writeHeader(stream);
	this.size += 2*7+6*4+32;
	stream.writeUint16(0); 
	stream.writeUint16(0);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint16(this.width);
	stream.writeUint16(this.height);
	stream.writeUint32(this.horizresolution);
	stream.writeUint32(this.vertresolution);
	stream.writeUint32(0);
	stream.writeUint16(this.frame_count);
	stream.writeString(this.compressorname, null, 32);
	stream.writeUint16(this.depth);
	stream.writeInt16(-1);
	this.writeFooter(stream);
}

mp4boxParser.AudioSampleEntry.prototype.write = function(stream) {
	this.writeHeader(stream);
	this.size += 2*4+3*4;
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint16(this.channel_count);
	stream.writeUint16(this.samplesize);
	stream.writeUint16(0);
	stream.writeUint16(0);
	stream.writeUint32(this.samplerate<<16);
	this.writeFooter(stream);
}

mp4boxParser.avcCBox.prototype.write = function(stream) {
	var i;
	this.size = 7;
	for (i = 0; i < this.SPS.length; i++) {
		this.size += 2+this.SPS[i].length;
	}
	for (i = 0; i < this.PPS.length; i++) {
		this.size += 2+this.PPS[i].length;
	}
	if (this.ext) {
		this.size += this.ext.length;
	}
	this.writeHeader(stream);
	stream.writeUint8(this.configurationVersion);
	stream.writeUint8(this.AVCProfileIndication);
	stream.writeUint8(this.profile_compatibility);
	stream.writeUint8(this.AVCLevelIndication);
	stream.writeUint8(this.lengthSizeMinusOne + (63<<2));
	stream.writeUint8(this.SPS.length + (7<<5));
	for (i = 0; i < this.SPS.length; i++) {
		stream.writeUint16(this.SPS[i].length);
		stream.writeUint8Array(this.SPS[i]);
	}
	stream.writeUint8(this.PPS.length);
	for (i = 0; i < this.PPS.length; i++) {
		stream.writeUint16(this.PPS[i].length);
		stream.writeUint8Array(this.PPS[i]);
	}	
	if (this.ext) {
		stream.writeUint8Array(this.ext);
	}
}

mp4boxParser.cttsBox.prototype.write = function(stream) {
	var i;
	this.version = 1;
	this.flags = 0;
	this.size = 4+8*this.sample_counts.length;
	this.writeHeader(stream);
	stream.writeUint32(this.sample_counts.length);
	for(i=0; i<this.sample_counts.length; i++) {
		stream.writeUint32(this.sample_counts[i]);
		stream.writeInt32(this.sample_offsets[i]); /* signed */
	}
}

mp4boxParser.cslgBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 0;
	this.size = 4*5;
	this.writeHeader(stream);
	stream.writeInt32(this.compositionToDTSShift);
	stream.writeInt32(this.leastDecodeToDisplayDelta);
	stream.writeInt32(this.greatestDecodeToDisplayDelta);
	stream.writeInt32(this.compositionStartTime);
	stream.writeInt32(this.compositionEndTime);
}

mp4boxParser.sttsBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 0;
	this.size = 4+8*this.sample_counts.length;
	this.writeHeader(stream);
	stream.writeUint32(this.sample_counts.length);
	for(i=0; i<this.sample_counts.length; i++) {
		stream.writeUint32(this.sample_counts[i]);
		stream.writeUint32(this.sample_deltas[i]);
	}
}

mp4boxParser.stssBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 4+4*this.sample_numbers.length;
	this.writeHeader(stream);
	stream.writeUint32(this.sample_numbers.length);
	stream.writeUint32Array(this.sample_numbers);
}

mp4boxParser.stshBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 0;
	this.size = 4+8*this.shadowed_sample_numbers.length;
	this.writeHeader(stream);
	stream.writeUint32(this.shadowed_sample_numbers.length);
	for(i=0; i<this.shadowed_sample_numbers.length; i++) {
		stream.writeUint32(this.shadowed_sample_numbers[i]);
		stream.writeUint32(this.sync_sample_numbers[i]);
	}
}

mp4boxParser.stcoBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 4+4*this.chunk_offsets.length;
	this.writeHeader(stream);
	stream.writeUint32(this.chunk_offsets.length);
	stream.writeUint32Array(this.chunk_offsets);
}

mp4boxParser.co64Box.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 0;
	this.size = 4+8*this.chunk_offsets.length;
	this.writeHeader(stream);
	stream.writeUint32(this.chunk_offsets.length);
	for(i=0; i<this.chunk_offsets.length; i++) {
		stream.writeUint64(this.chunk_offsets[i]);
	}
}

mp4boxParser.stscBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 0;
	this.size = 4+12*this.first_chunk.length;
	this.writeHeader(stream);
	stream.writeUint32(this.first_chunk.length);
	for(i=0; i<this.first_chunk.length; i++) {
		stream.writeUint32(this.first_chunk[i]);
		stream.writeUint32(this.samples_per_chunk[i]);
		stream.writeUint32(this.sample_description_index[i]);
	}
}

mp4boxParser.stszBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 0;
	this.size = 8+12*this.sample_sizes.length;
	this.writeHeader(stream);
	stream.writeUint32(0);
	stream.writeUint32(this.sample_sizes.length);
	stream.writeUint32Array(this.sample_sizes);
}

mp4boxParser.mehdBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 4;
	this.writeHeader(stream);
	stream.writeUint32(this.fragment_duration);
}

mp4boxParser.trexBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 4*5;
	this.writeHeader(stream);
	stream.writeUint32(this.track_ID);
	stream.writeUint32(this.default_sample_description_index);
	stream.writeUint32(this.default_sample_duration);
	stream.writeUint32(this.default_sample_size);
	stream.writeUint32(this.default_sample_flags);
}

mp4boxParser.mfhdBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 4;
	this.writeHeader(stream);
	stream.writeUint32(this.sequence_number);
}

mp4boxParser.tfhdBox.prototype.write = function(stream) {
	this.version = 0;
	this.size = 4;
	if (this.flags & mp4boxParser.TFHD_FLAG_BASE_OFFSET) {
		this.size += 8;
	}
	if (this.flags & mp4boxParser.TFHD_FLAG_SAMPLE_DESC) {
		this.size += 4;
	}
	if (this.flags & mp4boxParser.TFHD_FLAG_SAMPLE_DUR) {
		this.size += 4;
	}
	if (this.flags & mp4boxParser.TFHD_FLAG_SAMPLE_SIZE) {
		this.size += 4;
	}
	if (this.flags & mp4boxParser.TFHD_FLAG_SAMPLE_FLAGS) {
		this.size += 4;
	}
	this.writeHeader(stream);
	stream.writeUint32(this.track_ID);
	if (this.flags & mp4boxParser.TFHD_FLAG_BASE_OFFSET) {
		stream.writeUint64(this.base_data_offset);
	}
	if (this.flags & mp4boxParser.TFHD_FLAG_SAMPLE_DESC) {
		stream.writeUint32(this.default_sample_description_index);
	}
	if (this.flags & mp4boxParser.TFHD_FLAG_SAMPLE_DUR) {
		stream.writeUint32(this.default_sample_duration);
	}
	if (this.flags & mp4boxParser.TFHD_FLAG_SAMPLE_SIZE) {
		stream.writeUint32(this.default_sample_size);
	}
	if (this.flags & mp4boxParser.TFHD_FLAG_SAMPLE_FLAGS) {
		stream.writeUint32(this.default_sample_flags);
	}
}

mp4boxParser.trunBox.prototype.write = function(stream) {
	this.version = 0;
	this.size = 4;
	if (this.flags & mp4boxParser.TRUN_FLAGS_DATA_OFFSET) {
		this.size += 4;
	}
	if (this.flags & mp4boxParser.TRUN_FLAGS_FIRST_FLAG) {
		this.size += 4;
	}
	if (this.flags & mp4boxParser.TRUN_FLAGS_DURATION) {
		this.size += 4*this.sample_duration.length;
	}
	if (this.flags & mp4boxParser.TRUN_FLAGS_SIZE) {
		this.size += 4*this.sample_size.length;
	}
	if (this.flags & mp4boxParser.TRUN_FLAGS_FLAGS) {
		this.size += 4*this.sample_flags.length;
	}
	if (this.flags & mp4boxParser.TRUN_FLAGS_CTS_OFFSET) {
		this.size += 4*this.sample_composition_time_offset.length;
	}
	this.writeHeader(stream);
	stream.writeUint32(this.sample_count);
	if (this.flags & mp4boxParser.TRUN_FLAGS_DATA_OFFSET) {
		this.data_offset_position = stream.position;
		stream.writeInt32(this.data_offset); //signed
	}
	if (this.flags & mp4boxParser.TRUN_FLAGS_FIRST_FLAG) {
		stream.writeUint32(this.first_sample_flags);
	}
	for (var i = 0; i < this.sample_count; i++) {
		if (this.flags & mp4boxParser.TRUN_FLAGS_DURATION) {
			stream.writeUint32(this.sample_duration[i]);
		}
		if (this.flags & mp4boxParser.TRUN_FLAGS_SIZE) {
			stream.writeUint32(this.sample_size[i]);
		}
		if (this.flags & mp4boxParser.TRUN_FLAGS_FLAGS) {
			stream.writeUint32(this.sample_flags[i]);
		}
		if (this.flags & mp4boxParser.TRUN_FLAGS_CTS_OFFSET) {
			if (this.version == 0) {
				stream.writeUint32(this.sample_composition_time_offset[i]);
			} else {
				stream.writeInt32(this.sample_composition_time_offset[i]); //signed
			}
		}
	}		
}

mp4boxParser.tfdtBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 4;
	this.writeHeader(stream);
	if (this.version == 1) {
		stream.writeUint64(this.baseMediaDecodeTime);
	} else {
		stream.writeUint32(this.baseMediaDecodeTime); 
	}
}

mp4boxParser.ISOFile.prototype.resetTables = function () {
	var i;
	var trak, stco, stsc, stsz, stts, ctts, stss;
	this.moov.mvhd.duration = 0;
	for (i = 0; i < this.moov.traks.length; i++) {
		trak = this.moov.traks[i];
		trak.tkhd.duration = 0;
		trak.mdia.mdhd.duration = 0;
		stco = trak.mdia.minf.stbl.stco;
		stco.chunk_offsets = new Array();
		stsc = trak.mdia.minf.stbl.stsc;
		stsc.first_chunk = new Array();
		stsc.samples_per_chunk = new Array();
		stsc.sample_description_index = new Array();
		stsz = trak.mdia.minf.stbl.stsz;
		stsz.sample_sizes = new Array();
		stts = trak.mdia.minf.stbl.stts;
		stts.sample_counts = new Array();
		stts.sample_deltas = new Array();
		ctts = trak.mdia.minf.stbl.ctts;
		if (ctts) {
			ctts.sample_counts = new Array();
			ctts.sample_offsets = new Array();
		}
		stss = trak.mdia.minf.stbl.stss;
		var k = trak.mdia.minf.stbl.boxes.indexOf(stss);
		if (k != -1) trak.mdia.minf.stbl.boxes[k] = null;
		// if (stss) {
			// stss.sample_numbers = new Array();
		// }
	}
}

function MP4Fragmenter() {
	this.is_init = false;
	this.inputStream = null;
	this.inputIsoFile = null;
	this.onInit = null;
	this.initSent = false;
	this.onFragment = null;
	this.onError = null;
	this.flags = 0;
	this.nextMoofNumber = 0;
	this.fragdur = 500;
	this.startWithRap = false;
	this.noDefault = false;
}

/**
 * Sets the options for fragmentations
 *
 * @param {Number} dur The duration for fragments in milliseconds.
 * @param {Boolean} startWithRap A Boolean indicating if fragments should start with RAP or not.
 * @param {Boolean} noDefault A Boolean indicating if default flags should be placed in the moov or not.
 */
MP4Fragmenter.prototype.setFragmentOptions = function(dur, startWithRap, noDefault) {
	this.fragdur = dur;
	this.startWithRap = startWithRap;
	this.noDefault = noDefault;
}

mp4boxParser.ISOFile.prototype.buildSampleLists = function() {	
	var i, j, k;
	var trak, stco, stsc, stsz, stts, ctts, stss;
	var chunk_run_index, chunk_index, last_chunk_in_run, offset_in_chunk, last_sample_in_chunk;
	var last_sample_in_stts_run, stts_run_index, last_sample_in_ctts_run, ctts_run_index, last_stss_index;
	for (i = 0; i < this.moov.traks.length; i++) {
		trak = this.moov.traks[i];
		trak.samples = new Array();
		stco = trak.mdia.minf.stbl.stco;
		stsc = trak.mdia.minf.stbl.stsc;
		stsz = trak.mdia.minf.stbl.stsz;
		stts = trak.mdia.minf.stbl.stts;
		ctts = trak.mdia.minf.stbl.ctts;
		stss = trak.mdia.minf.stbl.stss;
		chunk_index = -1;
		chunk_run_index = -1;
		last_chunk_in_run = -1;
		offset_in_chunk = 0;
		last_sample_in_chunk = 0;
		last_sample_in_stts_run = -1;
		stts_run_index = -1;
		last_sample_in_ctts_run = -1;
		ctts_run_index = -1;
		last_stss_index = 0;
		/* we build the samples one by one and compute their properties */
		for (j = 0; j < stsz.sample_sizes.length; j++) {
			var sample = {};
			sample.track_id = trak.tkhd.track_id;
			trak.samples[j] = sample;
			/* size can be known directly */
			sample.size = stsz.sample_sizes[j];
			/* computing chunk-based properties (offset, sample description index)*/
			if (j < last_sample_in_chunk) {
				/* the new sample is in the same chunk, the indexes did not change */
				sample.chunk_index = chunk_index;
				sample.chunk_run_index = chunk_run_index;
			} else {
				/* the new sample is not in this chunk */
				offset_in_chunk = 0;
				chunk_index++;
				sample.chunk_index = chunk_index;
				if (chunk_index < last_chunk_in_run) {
					/* this new chunk in the same run of chunks */					
					sample.chunk_run_index = chunk_run_index;
				} else {
					/* this chunk starts a new run */
					if (chunk_run_index < stsc.first_chunk.length - 2) {
						/* the last chunk in this new run is the beginning of the next one */
						chunk_run_index++;
						last_chunk_in_run = stsc.first_chunk[chunk_run_index+1]-1; // chunk number are 1-based
					} else {
						/* the last chunk run in indefinitely long */
						last_chunk_in_run = Infinity; 
					}
				}
				last_sample_in_chunk += stsc.samples_per_chunk[chunk_run_index];
				sample.chunk_run_index = chunk_run_index;
			}	
			sample.description_index = stsc.sample_description_index[sample.chunk_run_index];
			sample.offset = stco.chunk_offsets[sample.chunk_index] + offset_in_chunk;
			offset_in_chunk += sample.size;
			/* setting dts, cts, duration and rap flags */
			if (j >= last_sample_in_stts_run) {
				stts_run_index++;
				if (last_sample_in_stts_run < 0) {
					last_sample_in_stts_run = 0;
				}
				last_sample_in_stts_run += stts.sample_counts[stts_run_index];				
			}
			if (j > 0) {
				sample.dts = trak.samples[j-1].dts + stts.sample_deltas[stts_run_index];
				trak.samples[j-1].duration = sample.dts - trak.samples[j-1].dts;
			} else {
				sample.dts = 0;
			}
			if (ctts) {
				if (j >= last_sample_in_ctts_run) {
					ctts_run_index++;
					if (last_sample_in_ctts_run < 0) {
						last_sample_in_ctts_run = 0;
					}
					last_sample_in_ctts_run += ctts.sample_counts[ctts_run_index];				
				}
				sample.cts = trak.samples[j].dts + ctts.sample_offsets[ctts_run_index];
			} else {
				sample.cts = sample.dts;
			}
			if (stss) {
				if (j == stss.sample_numbers[last_stss_index] - 1) { // sample numbers are 1-based
					sample.is_rap = true;
					last_stss_index++;
				} else {
					sample.is_rap = false;				
				}
			} else {
				sample.is_rap = true;
			}
		}
		trak.samples[j-1].duration = trak.mdia.mdhd.duration - trak.samples[j-1].dts;
	}
}

mp4boxParser.ISOFile.prototype.getCodecs = function() {	
	var i;
	var codecs = "";
	for (i = 0; i < this.moov.traks.length; i++) {
		var trak = this.moov.traks[i];
		if (i>0) {
			codecs+=","; 
		}
		codecs += trak.mdia.minf.stbl.stsd.entries[0].getCodec();		
	}
	return codecs;
}

MP4Fragmenter.prototype.createSingleSampleMoof = function(sample) {
	var moof = new mp4boxParser.moofBox();
	var mfhd = new mp4boxParser.mfhdBox();
	mfhd.sequence_number = this.nextMoofNumber;
	this.nextMoofNumber++;
	moof.boxes.push(mfhd);
	var traf = new mp4boxParser.trafBox();
	moof.boxes.push(traf);
	var tfhd = new mp4boxParser.tfhdBox();
	traf.boxes.push(tfhd);
	tfhd.track_ID = sample.track_id;
	tfhd.flags = mp4boxParser.TFHD_FLAG_DEFAULT_BASE_IS_MOOF;
	var tfdt = new mp4boxParser.tfdtBox();
	traf.boxes.push(tfdt);
	tfdt.baseMediaDecodeTime = sample.dts;
	var trun = new mp4boxParser.trunBox();
	traf.boxes.push(trun);
	moof.trun = trun;
	trun.flags = mp4boxParser.TRUN_FLAGS_DATA_OFFSET | mp4boxParser.TRUN_FLAGS_DURATION | 
				 mp4boxParser.TRUN_FLAGS_SIZE | mp4boxParser.TRUN_FLAGS_FLAGS | 
				 mp4boxParser.TRUN_FLAGS_CTS_OFFSET;
	trun.data_offset = 0;
	trun.first_sample_flags = 0;
	trun.sample_count = 1;
	trun.sample_duration = new Array();
	trun.sample_duration[0] = sample.duration;
	trun.sample_size = new Array();
	trun.sample_size[0] = sample.size;
	trun.sample_flags = new Array();
	trun.sample_flags[0] = 0;
	trun.sample_composition_time_offset = new Array();
	trun.sample_composition_time_offset[0] = sample.cts - sample.dts;
	return moof;
}

MP4Fragmenter.prototype.createFragment = function(input, trackNumber, sampleNumber, stream_) {
	var trak = input.moov.traks[trackNumber];
	var sample = trak.samples[sampleNumber];

	if (this.inputStream.byteLength < sample.offset + sample.size) {
		return null;
	}
	
	var stream = stream_ || new DataStream();
	stream.endianness = DataStream.BIG_ENDIAN;

	var moof = this.createSingleSampleMoof(sample);
	moof.write(stream);

	/* adjusting the data_offset now that the moof size is known*/
	moof.trun.data_offset = moof.size+8; //8 is mdat header
	mp4boxParser.log(mp4boxParser.LOG_LEVEL_DEBUG, "Adjusting data_offset with new value "+moof.trun.data_offset);
	stream.adjustUint32(moof.trun.data_offset_position, moof.trun.data_offset);
		
	var mdat = new mp4boxParser.mdatBox();
	mdat.data = new ArrayBuffer();
	this.inputStream.seek(sample.offset);
	mdat.data = this.inputStream.readUint8Array(sample.size);
	mdat.write(stream);
	return stream;
}

MP4Fragmenter.prototype.createNextFragment = function(input, track_number, stream) {
	var result;	
	result = this.createFragment(input, track_number, this.nextSample[track_number], stream);
	if (result) {
		this.nextSample[track_number]++;
	}
	return result;
}

var appendBuffer = function(buffer1, buffer2) {
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};		

/**
 * Parse an ArrayBuffer as an ISOBMFF file, fragments it and calls back the appropriate functions (
 *
 * @param {ArrayBuffer} ab The ArrayBuffer representing the file.
 * @see http://www.iso.org/iso/catalogue_detail.htm?csnumber=61988
 *     (ISO/IEC 14496-12:2012 section 8.16.3)
 */

MP4Fragmenter.prototype.fragment = function(ab) {
	var stream;
	
	if (!this.inputStream) {
		this.inputStream = new DataStream(ab, 0, DataStream.BIG_ENDIAN);	
	} else {
		this.inputStream.buffer = appendBuffer(this.inputStream.buffer, ab);
	}
	if (!this.inputIsoFile) {
		this.inputIsoFile = new mp4boxParser.ISOFile();
	}
	if (!this.inputIsoFile.moov) {
		this.inputIsoFile.parse(this.inputStream);
	}
	if (!this.inputIsoFile.moov) {
		return;	
	} 
	if (!this.is_init) {
		this.inputIsoFile.buildSampleLists();
		this.inputIsoFile.resetTables();
		this.nextSample = new Array(this.inputIsoFile.moov.traks.length);
		for(var i = 0; i < this.nextSample.length; i++) {
			this.nextSample[i] = 0;
		}
		this.nextMoofNumber = 0;
		this.is_init = true;		
	}
//	this.inputIsoFile.write(this.outputStream);
	
	if (this.onInit && !this.initSent) {
		stream = new DataStream();
		stream.endianness = DataStream.BIG_ENDIAN;
		this.inputIsoFile.writeInitializationSegment(stream);
		mp4boxParser.log(mp4boxParser.LOG_LEVEL_INFO, "Sending initialization segment");
		this.onInit(stream);
		this.initSent = true;
	}
	
	if (this.onFragment) {
		stream = null;
//		for (var i = 0; i < this.inputIsoFile.moov.traks[0].samples.length; i++) {
		for (var i = 0; i < 50; i++) {
			//stream = this.createNextFragment(this.inputIsoFile, 0, stream);
			stream = this.createFragment(this.inputIsoFile, 0, i, null);						
			mp4boxParser.log(mp4boxParser.LOG_LEVEL_INFO, "Sending media fragment"); 
			this.onFragment(stream);
		}
	}
}

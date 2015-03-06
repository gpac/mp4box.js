/* 
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var BoxParser = {
	ERR_NOT_ENOUGH_DATA : 0,
	OK : 1,
	boxCodes : [ 
				 "mdat", 
				 "avcC", "hvcC", "ftyp", 
				 "payl",
				 "vmhd", "smhd", "hmhd", "dref", "elst" // full boxes not yet parsed
			   ],
	fullBoxCodes : [ "mvhd", "tkhd", "mdhd", "hdlr", "smhd", "hmhd", "nhmd", "url ", "urn ", 
				  "ctts", "cslg", "stco", "co64", "stsc", "stss", "stsz", "stz2", "stts", "stsh", 
				  "mehd", "trex", "mfhd", "tfhd", "trun", "tfdt",
				  "esds", "subs",
				  "txtC"
				  /* missing "stsd": special case full box and container */
				],
	containerBoxCodes : [ 
		[ "moov", [ "trak" ] ],
		[ "trak" ],
		[ "edts" ],
		[ "mdia" ],
		[ "minf" ],
		[ "dinf" ],
		[ "stbl" ],
		[ "mvex", [ "trex" ] ],
		[ "moof", [ "traf" ] ],
		[ "traf", [ "trun" ] ],
		[ "vttc" ], 
		[ "tref" ]
	],
	sampleEntryCodes : [ 
		/* 4CC as registered on http://mp4ra.org/codecs.html */
		{ prefix: "Visual", types: [ "mp4v", "avc1", "avc2", "avc3", "avc4", "avcp", "drac", "encv", "mjp2", "mvc1", "mvc2", "resv", "s263", "svc1", "vc-1", "hvc1", "hev1"  ] },
		{ prefix: "Audio", 	types: [ "mp4a", "ac-3", "alac", "dra1", "dtsc", "dtse", ,"dtsh", "dtsl", "ec-3", "enca", "g719", "g726", "m4ae", "mlpa",  "raw ", "samr", "sawb", "sawp", "sevc", "sqcp", "ssmv", "twos" ] },
		{ prefix: "Hint", 	types: [ "fdp ", "m2ts", "pm2t", "prtp", "rm2t", "rrtp", "rsrp", "rtp ", "sm2t", "srtp" ] },
		{ prefix: "Metadata", types: [ "metx", "mett", "urim" ] },
		{ prefix: "Subtitle", types: [ "stpp", "wvtt", "sbtt", "tx3g", "stxt" ] }
	],
	trackReferenceTypes: [
		"scal"
	],
	initialize: function() {
		var i, j;
		var length;
		BoxParser.FullBox.prototype = new BoxParser.Box();
		BoxParser.ContainerBox.prototype = new BoxParser.Box();
		BoxParser.stsdBox.prototype = new BoxParser.FullBox();
		BoxParser.SampleEntry.prototype = new BoxParser.FullBox();
		BoxParser.TrackReferenceTypeBox.prototype = new BoxParser.Box();
		/* creating constructors for simple boxes */
		length = BoxParser.boxCodes.length;
		for (i=0; i<length; i++) {
			BoxParser[BoxParser.boxCodes[i]+"Box"] = (function (j) { /* creating a closure around the iterating value of i */
				return function(size) {
					BoxParser.Box.call(this, BoxParser.boxCodes[j], size);
				}
			})(i);
			BoxParser[BoxParser.boxCodes[i]+"Box"].prototype = new BoxParser.Box();
		}
		/* creating constructors for full boxes */
		length = BoxParser.fullBoxCodes.length;
		for (i=0; i<length; i++) {
			BoxParser[BoxParser.fullBoxCodes[i]+"Box"] = (function (j) { 
				return function(size) {
					BoxParser.FullBox.call(this, BoxParser.fullBoxCodes[j], size);
				}
			})(i);
			BoxParser[BoxParser.fullBoxCodes[i]+"Box"].prototype = new BoxParser.FullBox();
		}
		/* creating constructors for container boxes */
		length = BoxParser.containerBoxCodes.length;
		for (i=0; i<length; i++) {
			BoxParser[BoxParser.containerBoxCodes[i][0]+"Box"] = (function (j, subBoxNames) { 
				return function(size) {
					BoxParser.ContainerBox.call(this, BoxParser.containerBoxCodes[j][0], size);
					if (subBoxNames) {
						this.subBoxNames = subBoxNames;
						var nbSubBoxes = subBoxNames.length;
						for (var k = 0; k<nbSubBoxes; k++) {
							this[subBoxNames[k]+"s"] = [];
						}
					}
				}
			})(i, BoxParser.containerBoxCodes[i][1]);
			BoxParser[BoxParser.containerBoxCodes[i][0]+"Box"].prototype = new BoxParser.ContainerBox();
		}
		/* creating constructors for stsd entries  */
		length = BoxParser.sampleEntryCodes.length;
		for (j = 0; j < length; j++) {
			var prefix = BoxParser.sampleEntryCodes[j].prefix;
			var types = BoxParser.sampleEntryCodes[j].types;
			var nb_types = types.length;
			BoxParser[prefix+"SampleEntry"] = function(type, size) { BoxParser.SampleEntry.call(this, type, size); };
			BoxParser[prefix+"SampleEntry"].prototype = new BoxParser.SampleEntry();
			for (i=0; i<nb_types; i++) {
				BoxParser[types[i]+"Box"] = (function (k, l) { 
					return function(size) {
						BoxParser[BoxParser.sampleEntryCodes[k].prefix+"SampleEntry"].call(this, BoxParser.sampleEntryCodes[k].types[l], size);
					}
				})(j, i);
				BoxParser[types[i]+"Box"].prototype = new BoxParser[prefix+"SampleEntry"]();
			}
		}
		/* creating constructors for track reference type boxes */
		length = BoxParser.trackReferenceTypes.length;
		for (i=0; i<length; i++) {
			BoxParser[BoxParser.trackReferenceTypes[i]+"Box"] = (function (j) { 
				return function(size) {
					BoxParser.TrackReferenceTypeBox.call(this, BoxParser.trackReferenceTypes[j], size);
				}
			})(i);
			BoxParser[BoxParser.trackReferenceTypes[i]+"Box"].prototype = new BoxParser.Box();
		}
	},
	Box: function(_type, _size) {
		this.type = _type;
		this.size = _size;
	},
	FullBox: function(type, size) {
		BoxParser.Box.call(this, type, size);
		this.flags = 0;
		this.version = 0;
	},
	ContainerBox: function(type, size) {
		BoxParser.Box.call(this, type, size);
		this.boxes = [];
	},
	SampleEntry: function(type, size) {
		BoxParser.Box.call(this, type, size);	
		this.boxes = [];
	},
	TrackReferenceTypeBox: function(type, size) {
		BoxParser.Box.call(this, type, size);	
		this.track_ids = [];
	},
	stsdBox: function(size) {
		BoxParser.FullBox.call(this, "stsd", size);
		this.entries = [];
	},
	parseOneBox: function(stream, isSampleEntry) {
		var box;
		var start = stream.position;
		var hdr_size = 0;
		if (stream.byteLength - stream.position < 8) {
			Log.d("BoxParser", "Not enough data in stream to parse the type and size of the box");
			return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
		}
		var size = stream.readUint32();
		var type = stream.readString(4);
		Log.d("BoxParser", "Found box of type "+type+" and size "+size+" at position "+start+" in the current buffer ("+(stream.buffer.fileStart+start)+" in the file)");
		hdr_size = 8;
		if (type == "uuid") {
			uuid = stream.readString(16);
			hdr_size += 16;
		}
		if (size == 1) {
			if (stream.byteLength - stream.position < 8) {
				stream.seek(start);
				Log.w("BoxParser", "Not enough data in stream to parse the extended size of the \""+type+"\" box");
				return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
			}
			size = stream.readUint64();
			hdr_size += 8;
		} else if (size === 0) {
			/* box extends till the end of file */
			throw "Unlimited box size not supported";
		}
		
		if (start + size > stream.byteLength ) {
			stream.seek(start);
			Log.w("BoxParser", "Not enough data in stream to parse the entire \""+type+"\" box");
			return { code: BoxParser.ERR_NOT_ENOUGH_DATA, type: type, size: size, hdr_size: hdr_size };
		}
		if (BoxParser[type+"Box"]) {
			box = new BoxParser[type+"Box"](size - hdr_size);		
		} else {
			if (isSampleEntry) {
				box = new BoxParser.SampleEntry(type, size - hdr_size);
			} else {
				box = new BoxParser.Box(type, size - hdr_size);
			}
		}
		/* recording the position of the box in the input stream */
		box.hdr_size = hdr_size;
		box.start = start;
		box.fileStart = start + stream.buffer.fileStart;
		box.parse(stream);
		return { code: BoxParser.OK, box: box, size: size };
	},
}

BoxParser.initialize();

BoxParser.Box.prototype.parse = function(stream) {
	if (this.type != "mdat") {
		this.data = stream.readUint8Array(this.size);
	} else {
		stream.seek(this.start+this.size+this.hdr_size);
	}
}

BoxParser.FullBox.prototype.parseFullHeader = function (stream) {
	this.version = stream.readUint8();
	this.flags = stream.readUint24();
	this.size -= 4;
}

BoxParser.ContainerBox.prototype.parse = function(stream) {
	var ret;
	var box;
	var start;
	start = stream.position;
	while (stream.position < start+this.size) {
		ret = BoxParser.parseOneBox(stream);
		box = ret.box;
		/* store the box in the 'boxes' array to preserve box order (for offset) but also store box in a property for more direct access */
		this.boxes.push(box);
		if (this.subBoxNames && this.subBoxNames.indexOf(box.type) != -1) {
			this[this.subBoxNames+"s"].push(box);
		} else {
			this[box.type] = box;
		}
	}
}

BoxParser.SampleEntry.prototype.isVideo = function() {
	return false;
}

BoxParser.SampleEntry.prototype.isAudio = function() {
	return false;
}

BoxParser.SampleEntry.prototype.isSubtitle = function() {
	return false;
}

BoxParser.SampleEntry.prototype.isMetadata = function() {
	return false;
}

BoxParser.SampleEntry.prototype.isHint = function() {
	return false;
}

BoxParser.SampleEntry.prototype.getCodec = function() {
	return this.type;
}

BoxParser.SampleEntry.prototype.getWidth = function() {
	return "";
}

BoxParser.SampleEntry.prototype.getHeight = function() {
	return "";
}

BoxParser.SampleEntry.prototype.getChannelCount = function() {
	return "";
}

BoxParser.SampleEntry.prototype.getSampleRate = function() {
	return "";
}

BoxParser.SampleEntry.prototype.getSampleSize = function() {
	return "";
}

BoxParser.SampleEntry.prototype.parseHeader = function(stream) {
	this.start = stream.position;
	stream.readUint8Array(6);
	this.data_reference_index = stream.readUint16();
}

BoxParser.SampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	stream.seek(this.start+this.size);
}

BoxParser.SampleEntry.prototype.parseFooter = function(stream) {
	var ret;
	var box;
	while (stream.position < this.start+this.size) {
		ret = BoxParser.parseOneBox(stream, false);
		box = ret.box;
		this.boxes.push(box);
		this[box.type] = box;
	}	
}

BoxParser.VisualSampleEntry.prototype.parse = function(stream) {
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

BoxParser.VisualSampleEntry.prototype.isVideo = function() {
	return true;
}

BoxParser.VisualSampleEntry.prototype.getWidth = function() {
	return this.width;
}

BoxParser.VisualSampleEntry.prototype.getHeight = function() {
	return this.height;
}

BoxParser.AudioSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	stream.readUint32Array(2);
	this.channel_count = stream.readUint16();
	this.samplesize = stream.readUint16();
	stream.readUint16();
	stream.readUint16();
	this.samplerate = (stream.readUint32()/(1<<16));
	this.parseFooter(stream);
}

BoxParser.AudioSampleEntry.prototype.isAudio = function() {
	return true;
}

BoxParser.AudioSampleEntry.prototype.getChannelCount = function() {
	return this.channel_count;
}

BoxParser.AudioSampleEntry.prototype.getSampleRate = function() {
	return this.samplerate;
}

BoxParser.AudioSampleEntry.prototype.getSampleSize = function() {
	return this.samplesize;
}

BoxParser.SubtitleSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.parseFooter(stream);
}

BoxParser.SubtitleSampleEntry.prototype.isSubtitle = function() {
	return true;
}

BoxParser.MetadataSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.parseFooter(stream);
}

BoxParser.MetadataSampleEntry.prototype.isMetadata = function() {
	return true;
}

BoxParser.TrackReferenceTypeBox.prototype.parse = function(stream) {
	this.track_ids = stream.readUint8Array(this.size);
}

BoxParser.metxBox.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.content_encoding = stream.readCString();
	this.namespace = stream.readCString();
	this.schema_location = stream.readCString();
	this.parseFooter(stream);
}

BoxParser.mettBox.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.content_encoding = stream.readCString();
	this.mime_format = stream.readCString();
	this.parseFooter(stream);
}

BoxParser.sbttBox.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.content_encoding = stream.readCString();
	this.mime_format = stream.readCString();
	this.parseFooter(stream);
}

BoxParser.stxtBox.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.content_encoding = stream.readCString();
	this.mime_format = stream.readCString();
	this.parseFooter(stream);
}

BoxParser.stppBox.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.namespace = stream.readCString();
	this.schema_location = stream.readCString();
	this.auxiliary_mime_types = stream.readCString();
	this.parseFooter(stream);
}

BoxParser.tx3gBox.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.displayFlags = stream.readUint32();
	this.horizontal_justification = stream.readInt8();
	this.vertical_justification = stream.readInt8();
	this.bg_color_rgba = stream.readUint8Array(4);
	this.box_record = stream.readInt16Array(4);
	this.style_record = stream.readUint8Array(12);
	this.parseFooter(stream);
}

BoxParser.ftypBox.prototype.parse = function(stream) {
	this.major_brand = stream.readString(4);
	this.minor_version = stream.readUint32();
	this.size -= 8;
	this.compatible_brands = [];
	var i = 0;
	while (this.size>=4) {
		this.compatible_brands[i] = stream.readString(4);
		this.size -= 4;
		i++;
	}
}

BoxParser.mvhdBox.prototype.parse = function(stream) {
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
	this.volume = stream.readUint16()>>8;
	stream.readUint16();
	stream.readUint32Array(2);
	this.matrix = stream.readUint32Array(9);
	stream.readUint32Array(6);
	this.next_track_id = stream.readUint32();
}

BoxParser.TKHD_FLAG_ENABLED    = 0x000001;
BoxParser.TKHD_FLAG_IN_MOVIE   = 0x000002;
BoxParser.TKHD_FLAG_IN_PREVIEW = 0x000004;

BoxParser.tkhdBox.prototype.parse = function(stream) {
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
	this.layer = stream.readInt16();
	this.alternate_group = stream.readInt16();
	this.volume = stream.readInt16()>>8;
	stream.readUint16();
	this.matrix = stream.readInt32Array(9);
	this.width = stream.readUint32();
	this.height = stream.readUint32();
}

BoxParser.mdhdBox.prototype.parse = function(stream) {
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
	var chars = [];
	chars[0] = (this.language>>10)&0x1F;
	chars[1] = (this.language>>5)&0x1F;
	chars[2] = (this.language)&0x1F;
	this.languageString = String.fromCharCode(chars[0]+0x60, chars[1]+0x60, chars[2]+0x60);
	stream.readUint16();
}

BoxParser.hdlrBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.version === 0) {
		stream.readUint32();
		this.handler = stream.readString(4);
		stream.readUint32Array(3);
		this.name = stream.readCString();
	} else {
		this.data = stream.readUint8Array(size);
	}
}

BoxParser.stsdBox.prototype.parse = function(stream) {
	var ret;
	var entryCount;
	this.parseFullHeader(stream);
	entryCount = stream.readUint32();
	for (i = 1; i <= entryCount; i++) {
		ret = BoxParser.parseOneBox(stream, true);
		this.entries.push(ret.box);
	}
}

BoxParser.avcCBox.prototype.parse = function(stream) {
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

BoxParser.hvcCBox.prototype.parse = function(stream) {
	var i;
	var nb_nalus;
	var length;
	var tmp_byte;
	this.configurationVersion = stream.readUint8();
	tmp_byte = stream.readUint8();
	this.general_profile_space = tmp_byte >> 6;
	this.general_tier_flag = (tmp_byte & 0x20) >> 5;
	this.general_profile_idc = (tmp_byte & 0x1F);
	this.general_profile_compatibility = stream.readUint32();
	this.general_constraint_indicator = stream.readUint32() << 16 | stream.readUint16();
	this.general_level_idc = stream.readUint8();
	this.min_spatial_segmentation_idc = stream.readUint16() & 0xFFF;
	this.parallelismType = (stream.readUint8() & 0x3);
	this.chromaFormat = (stream.readUint8() & 0x3);
	this.bitDepthLumaMinus8 = (stream.readUint8() & 0x7);
	this.bitDepthChromaMinus8 = (stream.readUint8() & 0x7);
	this.avgFrameRate = stream.readUint16();
	tmp_byte = stream.readUint8();
	this.constantFrameRate = (tmp_byte >> 6);
	this.numTemporalLayers = (tmp_byte & 0XD) >> 3;
	this.temporalIdNested = (tmp_byte & 0X4) >> 2;
	this.lengthSizeMinusOne = (tmp_byte & 0X3);

	this.nalu_arrays = [];
	numOfArrays = stream.readUint8();
	for (i = 0; i < numOfArrays; i++) {
		var nalu_array = [];
		this.nalu_arrays.push(nalu_array);
		tmp_byte = stream.readUint8()
		nalu_array.completeness = (tmp_byte & 0x80) >> 7;
		nalu_array.nalu_type = tmp_byte & 0x3F;
		numNalus = stream.readUint16();
		for (j = 0; j < numNalus; j++) {
			var nalu = {}
			nalu_array.push(nalu);
			length = stream.readUint16();
			nalu.data   = stream.readUint8Array(length);
		}
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

BoxParser.avc1Box.prototype.getCodec = function() {
	var baseCodec = BoxParser.SampleEntry.prototype.getCodec.call(this);
	if (this.avcC) {
		return baseCodec+"."+decimalToHex(this.avcC.AVCProfileIndication)+
						  ""+decimalToHex(this.avcC.profile_compatibility)+
						  ""+decimalToHex(this.avcC.AVCLevelIndication);		
	} else {
		return baseCodec;
	}
}

BoxParser.hvc1Box.prototype.getCodec = function() {
	var baseCodec = BoxParser.SampleEntry.prototype.getCodec.call(this);
	if (this.hvcC) {
		baseCodec += '.';
		switch (this.hvcC.general_profile_space) {
			case 0: 
				baseCodec += '';
				break;
			case 1: 
				baseCodec += 'A';
				break;
			case 2: 
				baseCodec += 'B';
				break;
			case 3: 
				baseCodec += 'C';
				break;
		
		}
		baseCodec += this.hvcC.general_profile_idc;
		baseCodec += '.';
		baseCodec += decimalToHex(this.hvcC.general_profile_compatibility, 0);
		baseCodec += '.';
		if (this.hvcC.general_tier_flag == 0) {
			baseCodec += 'L';
		} else {
			baseCodec += 'H';
		}
		baseCodec += this.hvcC.general_level_idc;
	} 
	return baseCodec;
}

BoxParser.mp4aBox.prototype.getCodec = function() {
	var baseCodec = BoxParser.SampleEntry.prototype.getCodec.call(this);
	if (this.esds && this.esds.esd) {
		var oti = this.esds.esd.getOTI();
		var dsi = this.esds.esd.getAudioConfig();
		return baseCodec+"."+decimalToHex(oti)+(dsi ? "."+dsi: "");
	} else {
		return baseCodec;
	}
}

BoxParser.esdsBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.data = stream.readUint8Array(this.size);
	this.size = 0;
	var esd_parser = new MPEG4DescriptorParser();
	this.esd = esd_parser.parseOneDescriptor(new DataStream(this.data.buffer, 0, DataStream.BIG_ENDIAN));
}

BoxParser.txtCBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.config = stream.readCString();
}

BoxParser.cttsBox.prototype.parse = function(stream) {
	var entry_count;
	var i;
	this.parseFullHeader(stream);
	entry_count = stream.readUint32();
	this.sample_counts = [];
	this.sample_offsets = [];
	if (this.version === 0) {
		for(i=0; i<entry_count; i++) {
			this.sample_counts.push(stream.readUint32());
			/* some files are buggy and declare version=0 while using signed offsets. 
			   The likelyhood of using the most significant bit in a 32-bits time offset is very low,
			   so using signed value here as well */ 
			this.sample_offsets.push(stream.readInt32());
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

BoxParser.cttsBox.prototype.unpack = function(samples) {
	var i, j, k;
	k = 0;
	for (i = 0; i < this.sample_counts.length; i++) {
		for (j = 0; j < this.sample_counts[i]; j++) {
			samples[k].pts = samples[k].dts + this.sample_offsets[i];
			k++;
		}
	}
}

BoxParser.cslgBox.prototype.parse = function(stream) {
	var entry_count;
	this.parseFullHeader(stream);
	if (this.version === 0) {
		this.compositionToDTSShift = stream.readInt32(); /* signed */
		this.leastDecodeToDisplayDelta = stream.readInt32(); /* signed */
		this.greatestDecodeToDisplayDelta = stream.readInt32(); /* signed */
		this.compositionStartTime = stream.readInt32(); /* signed */
		this.compositionEndTime = stream.readInt32(); /* signed */
	} else {
		this.data = stream.readUint8Array(this.size-4);
	}
}

BoxParser.sttsBox.prototype.parse = function(stream) {
	var entry_count;
	var i;
	this.parseFullHeader(stream);
	entry_count = stream.readUint32();
	this.sample_counts = [];
	this.sample_deltas = [];
	if (this.version === 0) {
		for(i=0; i<entry_count; i++) {
			this.sample_counts.push(stream.readUint32());
			this.sample_deltas.push(stream.readUint32());
		}
	} else {
		this.data = stream.readUint8Array(this.size-4);
	}
}

BoxParser.sttsBox.prototype.unpack = function(samples) {
	var i, j, k;
	k = 0;
	for (i = 0; i < this.sample_counts.length; i++) {
		for (j = 0; j < this.sample_counts[i]; j++) {
			if (k === 0) {
				samples[k].dts = 0;
			} else {
				samples[k].dts = samples[k-1].dts + this.sample_deltas[i];
			}
			k++;
		}
	}
}

BoxParser.stssBox.prototype.parse = function(stream) {
	var entry_count;
	this.parseFullHeader(stream);
	entry_count = stream.readUint32();
	if (this.version === 0) {
		this.sample_numbers = stream.readUint32Array(entry_count);
	} else {
		this.data = stream.readUint8Array(this.size-4);
	}
}

BoxParser.stshBox.prototype.parse = function(stream) {
	var entry_count;
	var i;
	this.parseFullHeader(stream);
	entry_count = stream.readUint32();
	this.shadowed_sample_numbers = [];
	this.sync_sample_numbers = [];
	if (this.version === 0) {
		for(i=0; i<entry_count; i++) {
			this.shadowed_sample_numbers.push(stream.readUint32());
			this.sync_sample_numbers.push(stream.readUint32());
		}
	} else {
		this.data = stream.readUint8Array(this.size-4);
	}
}

BoxParser.stcoBox.prototype.parse = function(stream) {
	var entry_count;
	this.parseFullHeader(stream);
	entry_count = stream.readUint32();
	if (this.version === 0) {
		this.chunk_offsets = stream.readUint32Array(entry_count);
	} else {
		this.data = stream.readUint8Array(this.size-4);
	}
}

BoxParser.stcoBox.prototype.unpack = function(samples) {
	var i;
	for (i = 0; i < this.chunk_offsets.length; i++) {
		samples[i].offset = this.chunk_offsets[i];
	}
}

BoxParser.co64Box.prototype.parse = function(stream) {
	var entry_count;
	var i;
	this.parseFullHeader(stream);
	entry_count = stream.readUint32();
	this.chunk_offsets = [];
	if (this.version === 0) {
		for(i=0; i<entry_count; i++) {
			this.chunk_offsets.push(stream.readUint64());
		}
	} else {
		this.data = stream.readUint8Array(this.size-4);
	}
}

BoxParser.stscBox.prototype.parse = function(stream) {
	var entry_count;
	var i;
	this.parseFullHeader(stream);
	entry_count = stream.readUint32();
	this.first_chunk = [];
	this.samples_per_chunk = [];
	this.sample_description_index = [];
	if (this.version === 0) {
		for(i=0; i<entry_count; i++) {
			this.first_chunk.push(stream.readUint32());
			this.samples_per_chunk.push(stream.readUint32());
			this.sample_description_index.push(stream.readUint32());
		}
	} else {
		this.data = stream.readUint8Array(this.size-4);
	}
}

BoxParser.stscBox.prototype.unpack = function(samples) {
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

BoxParser.stszBox.prototype.parse = function(stream) {
	var i;
	var sample_size;
	var sample_count;
	this.parseFullHeader(stream);
	this.sample_sizes = [];
	if (this.version === 0) {
		sample_size = stream.readUint32();
		sample_count = stream.readUint32();
		if (sample_size === 0) {
			this.sample_sizes = stream.readUint32Array(sample_count);
		} else {
			this.sample_sizes = [];
			for (i = 0; i < sample_count; i++) {
				this.sample_sizes[i] = sample_size;
			}		
		}
	} else {
		this.data = stream.readUint8Array(this.size);
	}
}

BoxParser.stszBox.prototype.unpack = function(samples) {
	var i;
	for (i = 0; i < this.sample_sizes.length; i++) {
		samples[i].size = this.sample_sizes[i];
	}
}

BoxParser.mehdBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.version == 1) {
		this.fragment_duration = stream.readUint64();
	} else {
		this.fragment_duration = stream.readUint32();
	}
}

BoxParser.trexBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.track_id = stream.readUint32();
	this.default_sample_description_index = stream.readUint32();
	this.default_sample_duration = stream.readUint32();
	this.default_sample_size = stream.readUint32();
	this.default_sample_flags = stream.readUint32();
}

BoxParser.mfhdBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.sequence_number = stream.readUint32();
}

BoxParser.TFHD_FLAG_BASE_DATA_OFFSET		= 0x01;
BoxParser.TFHD_FLAG_SAMPLE_DESC			= 0x02;
BoxParser.TFHD_FLAG_SAMPLE_DUR			= 0x08;
BoxParser.TFHD_FLAG_SAMPLE_SIZE			= 0x10;
BoxParser.TFHD_FLAG_SAMPLE_FLAGS			= 0x20;
BoxParser.TFHD_FLAG_DUR_EMPTY			= 0x10000;
BoxParser.TFHD_FLAG_DEFAULT_BASE_IS_MOOF	= 0x20000;

BoxParser.tfhdBox.prototype.parse = function(stream) {
	var readBytes = 0;
	this.parseFullHeader(stream);
	this.track_id = stream.readUint32();
	if (this.size > readBytes && (this.flags & BoxParser.TFHD_FLAG_BASE_DATA_OFFSET)) {
		this.base_data_offset = stream.readUint64();
		readBytes += 8;
	} else {
		this.base_data_offset = 0;
	}
	if (this.size > readBytes && (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DESC)) {
		this.default_sample_description_index = stream.readUint32();
		readBytes += 4;
	} else {
		this.default_sample_description_index = 0;
	}
	if (this.size > readBytes && (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DUR)) {
		this.default_sample_duration = stream.readUint32();
		readBytes += 4;
	} else {
		this.default_sample_duration = 0;
	}
	if (this.size > readBytes && (this.flags & BoxParser.TFHD_FLAG_SAMPLE_SIZE)) {
		this.default_sample_size = stream.readUint32();
		readBytes += 4;
	} else {
		this.default_sample_size = 0;
	}
	if (this.size > readBytes && (this.flags & BoxParser.TFHD_FLAG_SAMPLE_FLAGS)) {
		this.default_sample_flags = stream.readUint32();
		readBytes += 4;
	} else {
		this.default_sample_flags = 0;
	}
}

BoxParser.TRUN_FLAGS_DATA_OFFSET	= 0x01;
BoxParser.TRUN_FLAGS_FIRST_FLAG	= 0x04;
BoxParser.TRUN_FLAGS_DURATION	= 0x100;
BoxParser.TRUN_FLAGS_SIZE		= 0x200;
BoxParser.TRUN_FLAGS_FLAGS		= 0x400;
BoxParser.TRUN_FLAGS_CTS_OFFSET	= 0x800;

BoxParser.trunBox.prototype.parse = function(stream) {
	var readBytes = 0;
	this.parseFullHeader(stream);
	this.sample_count = stream.readUint32();
	readBytes+= 4;
	if (this.size > readBytes && (this.flags & BoxParser.TRUN_FLAGS_DATA_OFFSET) ) {
		this.data_offset = stream.readInt32(); //signed
		readBytes += 4;
	} else {
		this.data_offset = 0;
	}
	if (this.size > readBytes && (this.flags & BoxParser.TRUN_FLAGS_FIRST_FLAG) ) {
		this.first_sample_flags = stream.readUint32();
		readBytes += 4;
	} else {
		this.first_sample_flags = 0;
	}
	this.sample_duration = [];
	this.sample_size = [];
	this.sample_flags = [];
	this.sample_composition_time_offset = [];
	if (this.size > readBytes) {
		for (var i = 0; i < this.sample_count; i++) {
			if (this.flags & BoxParser.TRUN_FLAGS_DURATION) {
				this.sample_duration[i] = stream.readUint32();
			}
			if (this.flags & BoxParser.TRUN_FLAGS_SIZE) {
				this.sample_size[i] = stream.readUint32();
			}
			if (this.flags & BoxParser.TRUN_FLAGS_FLAGS) {
				this.sample_flags[i] = stream.readUint32();
			}
			if (this.flags & BoxParser.TRUN_FLAGS_CTS_OFFSET) {
				if (this.version === 0) {
					this.sample_composition_time_offset[i] = stream.readUint32();
				} else {
					this.sample_composition_time_offset[i] = stream.readInt32(); //signed
				}
			}
		}
	}
}

BoxParser.tfdtBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.version == 1) {
		this.baseMediaDecodeTime = stream.readUint64();
	} else {
		this.baseMediaDecodeTime = stream.readUint32();
	}
}

BoxParser.paylBox.prototype.parse = function(stream) {
	this.text = stream.readString(this.size);
}

BoxParser.subsBox.prototype.parse = function(stream) {
	var i,j;
	var entry_count;
	var subsample_count;
	this.parseFullHeader(stream);
	entry_count = stream.readUint32();
	this.samples = [];
	for (i = 0; i < entry_count; i++) {
		var sampleInfo = {};
		this.samples[i] = sampleInfo;
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
				subsample.reserved = stream.readUint32();
			}
		}
	}
}

BoxParser.Box.prototype.writeHeader = function(stream, msg) {
	this.size += 8;
	if (this.size > MAX_SIZE) {
		this.size += 8;
	}
	Log.d("BoxWriter", "Writing box "+this.type+" of size: "+this.size+" at position "+stream.position+(msg || ""));
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

BoxParser.FullBox.prototype.writeHeader = function(stream) {
	this.size += 4;
	BoxParser.Box.prototype.writeHeader.call(this, stream, " v="+this.version+" f="+this.flags);
	stream.writeUint8(this.version);
	stream.writeUint24(this.flags);
}

BoxParser.Box.prototype.write = function(stream) {
	if (this.type === "mdat") {
		/* TODO: fix this */
		if (this.data) {
			this.size = this.data.length;
			this.writeHeader(stream);
			stream.writeUint8Array(this.data);
		}
	} else {
		this.size = this.data.length;
		this.writeHeader(stream);
		stream.writeUint8Array(this.data);
	}
}

BoxParser.ContainerBox.prototype.write = function(stream) {
	this.size = 0;
	this.writeHeader(stream);
	for (var i=0; i<this.boxes.length; i++) {
		if (this.boxes[i]) {
			this.boxes[i].write(stream);
			this.size += this.boxes[i].size;
		}
	}
	/* adjusting the size, now that all sub-boxes are known */
	Log.d("BoxWriter", "Adjusting box "+this.type+" with new size "+this.size);
	stream.adjustUint32(this.sizePosition, this.size);
}

BoxParser.TrackReferenceTypeBox.prototype.write = function(stream) {
	this.size = this.track_ids.length*4;
	this.writeHeader(stream);
	stream.writeUint32Array(this.track_ids);
}

BoxParser.ftypBox.prototype.write = function(stream) {
	this.size = 8+4*this.compatible_brands.length;
	this.writeHeader(stream);
	stream.writeString(this.major_brand, null, 4);
	stream.writeUint32(this.minor_version);
	for (var i = 0; i < this.compatible_brands.length; i++) {
		stream.writeString(this.compatible_brands[i], null, 4);
	}
}

BoxParser.mvhdBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 23*4+2*2;
	this.writeHeader(stream);
	stream.writeUint32(this.creation_time);
	stream.writeUint32(this.modification_time);
	stream.writeUint32(this.timescale);
	stream.writeUint32(this.duration);
	stream.writeUint32(this.rate);
	stream.writeUint16(this.volume<<8);
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
	stream.writeUint32(this.next_track_id);
}

BoxParser.tkhdBox.prototype.write = function(stream) {
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
	stream.writeInt16(this.layer);
	stream.writeInt16(this.alternate_group);
	stream.writeInt16(this.volume<<8);
	stream.writeUint16(0);
	stream.writeInt32Array(this.matrix);
	stream.writeUint32(this.width);
	stream.writeUint32(this.height);
}

BoxParser.mdhdBox.prototype.write = function(stream) {
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

BoxParser.hdlrBox.prototype.write = function(stream) {
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

BoxParser.stsdBox.prototype.write = function(stream) {
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
	Log.d("BoxWriter", "Adjusting box "+this.type+" with new size "+this.size);
	stream.adjustUint32(this.sizePosition, this.size);
}

BoxParser.SampleEntry.prototype.writeHeader = function(stream) {
	this.size = 8;
	BoxParser.Box.prototype.writeHeader.call(this, stream);
	stream.writeUint8(0);
	stream.writeUint8(0);
	stream.writeUint8(0);
	stream.writeUint8(0);
	stream.writeUint8(0);
	stream.writeUint8(0);
	stream.writeUint16(this.data_reference_index);
}

BoxParser.SampleEntry.prototype.writeFooter = function(stream) {
	for (var i=0; i<this.boxes.length; i++) {
		this.boxes[i].write(stream);
		this.size += this.boxes[i].size;
	}
	Log.d("BoxWriter", "Adjusting box "+this.type+" with new size "+this.size);
	stream.adjustUint32(this.sizePosition, this.size);	
}

BoxParser.SampleEntry.prototype.write = function(stream) {
	this.writeHeader(stream);
	this.writeFooter(stream);
}

BoxParser.VisualSampleEntry.prototype.write = function(stream) {
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

BoxParser.AudioSampleEntry.prototype.write = function(stream) {
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

BoxParser.avcCBox.prototype.write = function(stream) {
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

BoxParser.cttsBox.prototype.write = function(stream) {
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

BoxParser.cslgBox.prototype.write = function(stream) {
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

BoxParser.sttsBox.prototype.write = function(stream) {
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

BoxParser.stssBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 4+4*this.sample_numbers.length;
	this.writeHeader(stream);
	stream.writeUint32(this.sample_numbers.length);
	stream.writeUint32Array(this.sample_numbers);
}

BoxParser.stshBox.prototype.write = function(stream) {
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

BoxParser.stcoBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 4+4*this.chunk_offsets.length;
	this.writeHeader(stream);
	stream.writeUint32(this.chunk_offsets.length);
	stream.writeUint32Array(this.chunk_offsets);
}

BoxParser.co64Box.prototype.write = function(stream) {
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

BoxParser.stscBox.prototype.write = function(stream) {
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

BoxParser.stszBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 0;
	this.size = 8+12*this.sample_sizes.length;
	this.writeHeader(stream);
	stream.writeUint32(0);
	stream.writeUint32(this.sample_sizes.length);
	stream.writeUint32Array(this.sample_sizes);
}

BoxParser.mehdBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 4;
	this.writeHeader(stream);
	stream.writeUint32(this.fragment_duration);
}

BoxParser.trexBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 4*5;
	this.writeHeader(stream);
	stream.writeUint32(this.track_id);
	stream.writeUint32(this.default_sample_description_index);
	stream.writeUint32(this.default_sample_duration);
	stream.writeUint32(this.default_sample_size);
	stream.writeUint32(this.default_sample_flags);
}

BoxParser.mfhdBox.prototype.write = function(stream) {
	this.version = 0;
	this.flags = 0;
	this.size = 4;
	this.writeHeader(stream);
	stream.writeUint32(this.sequence_number);
}

BoxParser.tfhdBox.prototype.write = function(stream) {
	this.version = 0;
	this.size = 4;
	if (this.flags & BoxParser.TFHD_FLAG_BASE_OFFSET) {
		this.size += 8;
	}
	if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DESC) {
		this.size += 4;
	}
	if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DUR) {
		this.size += 4;
	}
	if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_SIZE) {
		this.size += 4;
	}
	if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_FLAGS) {
		this.size += 4;
	}
	this.writeHeader(stream);
	stream.writeUint32(this.track_id);
	if (this.flags & BoxParser.TFHD_FLAG_BASE_OFFSET) {
		stream.writeUint64(this.base_data_offset);
	}
	if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DESC) {
		stream.writeUint32(this.default_sample_description_index);
	}
	if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DUR) {
		stream.writeUint32(this.default_sample_duration);
	}
	if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_SIZE) {
		stream.writeUint32(this.default_sample_size);
	}
	if (this.flags & BoxParser.TFHD_FLAG_SAMPLE_FLAGS) {
		stream.writeUint32(this.default_sample_flags);
	}
}

BoxParser.trunBox.prototype.write = function(stream) {
	this.version = 0;
	this.size = 4;
	if (this.flags & BoxParser.TRUN_FLAGS_DATA_OFFSET) {
		this.size += 4;
	}
	if (this.flags & BoxParser.TRUN_FLAGS_FIRST_FLAG) {
		this.size += 4;
	}
	if (this.flags & BoxParser.TRUN_FLAGS_DURATION) {
		this.size += 4*this.sample_duration.length;
	}
	if (this.flags & BoxParser.TRUN_FLAGS_SIZE) {
		this.size += 4*this.sample_size.length;
	}
	if (this.flags & BoxParser.TRUN_FLAGS_FLAGS) {
		this.size += 4*this.sample_flags.length;
	}
	if (this.flags & BoxParser.TRUN_FLAGS_CTS_OFFSET) {
		this.size += 4*this.sample_composition_time_offset.length;
	}
	this.writeHeader(stream);
	stream.writeUint32(this.sample_count);
	if (this.flags & BoxParser.TRUN_FLAGS_DATA_OFFSET) {
		this.data_offset_position = stream.position;
		stream.writeInt32(this.data_offset); //signed
	}
	if (this.flags & BoxParser.TRUN_FLAGS_FIRST_FLAG) {
		stream.writeUint32(this.first_sample_flags);
	}
	for (var i = 0; i < this.sample_count; i++) {
		if (this.flags & BoxParser.TRUN_FLAGS_DURATION) {
			stream.writeUint32(this.sample_duration[i]);
		}
		if (this.flags & BoxParser.TRUN_FLAGS_SIZE) {
			stream.writeUint32(this.sample_size[i]);
		}
		if (this.flags & BoxParser.TRUN_FLAGS_FLAGS) {
			stream.writeUint32(this.sample_flags[i]);
		}
		if (this.flags & BoxParser.TRUN_FLAGS_CTS_OFFSET) {
			if (this.version === 0) {
				stream.writeUint32(this.sample_composition_time_offset[i]);
			} else {
				stream.writeInt32(this.sample_composition_time_offset[i]); //signed
			}
		}
	}		
}

BoxParser.tfdtBox.prototype.write = function(stream) {
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

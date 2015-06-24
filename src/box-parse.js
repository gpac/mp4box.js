/* 
 * Copyright (c) Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
BoxParser.Box.prototype.parse = function(stream) {
	if (this.type != "mdat") {
		this.data = stream.readUint8Array(this.size-this.hdr_size);
	} else {
		if (this.size === 0) {
			stream.seek(stream.byteLength);
		} else {
			stream.seek(this.start+this.size);
		}
	}
}

BoxParser.FullBox.prototype.parseFullHeader = function (stream) {
	this.version = stream.readUint8();
	this.flags = stream.readUint24();
	this.hdr_size += 4;
}

BoxParser.ContainerBox.prototype.parse = function(stream) {
	var ret;
	var box;
	while (stream.position < this.start+this.size) {
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

BoxParser.SampleEntry.prototype.parseHeader = function(stream) {
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

BoxParser.SubtitleSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.parseFooter(stream);
}

BoxParser.MetadataSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.parseFooter(stream);
}

BoxParser.SystemSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.parseFooter(stream);
}

BoxParser.metxSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.content_encoding = stream.readCString();
	this.namespace = stream.readCString();
	this.schema_location = stream.readCString();
	this.parseFooter(stream);
}

BoxParser.mettSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.content_encoding = stream.readCString();
	this.mime_format = stream.readCString();
	this.parseFooter(stream);
}

BoxParser.sbttSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.content_encoding = stream.readCString();
	this.mime_format = stream.readCString();
	this.parseFooter(stream);
}

BoxParser.stxtSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.content_encoding = stream.readCString();
	this.mime_format = stream.readCString();
	this.parseFooter(stream);
}

BoxParser.stppSampleEntry.prototype.parse = function(stream) {
	this.parseHeader(stream);
	this.namespace = stream.readCString();
	this.schema_location = stream.readCString();
	this.auxiliary_mime_types = stream.readCString();
	this.parseFooter(stream);
}

BoxParser.tx3gSampleEntry.prototype.parse = function(stream) {
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
	var toparse = this.size - this.hdr_size;
	this.major_brand = stream.readString(4);
	this.minor_version = stream.readUint32();
	toparse -= 8;
	this.compatible_brands = [];
	var i = 0;
	while (toparse>=4) {
		this.compatible_brands[i] = stream.readString(4);
		toparse -= 4;
		i++;
	}
}

BoxParser.stypBox.prototype.parse = BoxParser.ftypBox.prototype.parse;

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

BoxParser.Box.prototype.parseLanguage = function(stream) {
	this.language = stream.readUint16();
	var chars = [];
	chars[0] = (this.language>>10)&0x1F;
	chars[1] = (this.language>>5)&0x1F;
	chars[2] = (this.language)&0x1F;
	this.languageString = String.fromCharCode(chars[0]+0x60, chars[1]+0x60, chars[2]+0x60);
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
	this.parseLanguage(stream);
	stream.readUint16();
}

BoxParser.hdlrBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.version === 0) {
		stream.readUint32();
		this.handler = stream.readString(4);
		stream.readUint32Array(3);
		this.name = stream.readString(this.size-this.hdr_size-20);
	} else {
		this.data = stream.readUint8Array(this.size-this.hdr_size);
	}
}

BoxParser.stsdBox = function(size) {
	BoxParser.FullBox.call(this, "stsd", size);
	this.entries = [];
};
BoxParser.stsdBox.prototype = new BoxParser.FullBox();
BoxParser.stsdBox.prototype.parse = function(stream) {
	var ret;
	var entryCount;
	var box;
	this.parseFullHeader(stream);
	entryCount = stream.readUint32();
	for (i = 1; i <= entryCount; i++) {
		ret = BoxParser.parseOneBox(stream, true);
		if (BoxParser[ret.type+"SampleEntry"]) {
			box = new BoxParser[ret.type+"SampleEntry"](ret.size);
			box.hdr_size = ret.hdr_size;
			box.start = ret.start;
			box.fileStart = ret.fileStart;
		} else {
			Log.warn("BoxParser", "Unknown sample entry type: "+ret.type);
			box = new BoxParser.SampleEntry(ret.type, ret.size, ret.hdr_size, ret.start, ret.fileStart);
		}
		box.parse(stream);
		this.entries.push(box);
	}
}

BoxParser.avcCBox.prototype.parse = function(stream) {
	var i;
	var nb_nalus;
	var length;
	var toparse;
	this.configurationVersion = stream.readUint8();
	this.AVCProfileIndication = stream.readUint8();
	this.profile_compatibility = stream.readUint8();
	this.AVCLevelIndication = stream.readUint8();
	this.lengthSizeMinusOne = (stream.readUint8() & 0x3);
	nb_nalus = (stream.readUint8() & 0x1F);
	toparse = this.size - this.hdr_size - 6;
	this.SPS = new Array(nb_nalus); 
	for (i = 0; i < nb_nalus; i++) {
		length = stream.readUint16();
		this.SPS[i] = stream.readUint8Array(length);
		toparse -= 2+length;
	}
	nb_nalus = stream.readUint8();
	toparse--;
	this.PPS = new Array(nb_nalus); 
	for (i = 0; i < nb_nalus; i++) {
		length = stream.readUint16();
		this.PPS[i] = stream.readUint8Array(length);
		toparse -= 2+length;
	}
	if (toparse>0) {
		this.ext = stream.readUint8Array(toparse);
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
	this.general_constraint_indicator = stream.readUint8Array(6);
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

BoxParser.esdsBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.data = stream.readUint8Array(this.size-this.hdr_size);
	if (typeof MPEG4DescriptorParser !== "undefined") {
		var esd_parser = new MPEG4DescriptorParser();
		this.esd = esd_parser.parseOneDescriptor(new DataStream(this.data.buffer, 0, DataStream.BIG_ENDIAN));
	} 
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
		this.data = stream.readUint8Array(this.size-this.hdr_size-4);
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
		this.data = stream.readUint8Array(this.size-this.hdr_size-4);
	}
}

BoxParser.sttsBox.prototype.parse = function(stream) {
	var entry_count;
	var i;
	var delta;
	this.parseFullHeader(stream);
	entry_count = stream.readUint32();
	this.sample_counts = [];
	this.sample_deltas = [];
	if (this.version === 0) {
		for(i=0; i<entry_count; i++) {
			this.sample_counts.push(stream.readUint32());
			delta = stream.readInt32();
			if (delta < 0) {
				Log.warn("BoxParser", "File uses negative stts sample delta, using value 1 instead, sync may be lost!");
				delta = 1;
			}
			this.sample_deltas.push(delta);
		}
	} else {
		this.data = stream.readUint8Array(this.size-this.hdr_size-4);
	}
}

BoxParser.stssBox.prototype.parse = function(stream) {
	var entry_count;
	this.parseFullHeader(stream);
	entry_count = stream.readUint32();
	if (this.version === 0) {
		this.sample_numbers = [];
		for(i=0; i<entry_count; i++) {
			this.sample_numbers.push(stream.readUint32());
		}
	} else {
		this.data = stream.readUint8Array(this.size-this.hdr_size-4);
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
		this.data = stream.readUint8Array(this.size-this.hdr_size-4);
	}
}

BoxParser.stcoBox.prototype.parse = function(stream) {
	var entry_count;
	this.parseFullHeader(stream);
	entry_count = stream.readUint32();
	if (this.version === 0) {
		this.chunk_offsets = stream.readUint32Array(entry_count);
	} else {
		this.data = stream.readUint8Array(this.size-this.hdr_size-4);
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
		this.data = stream.readUint8Array(this.size-this.hdr_size-4);
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
		this.data = stream.readUint8Array(this.size-this.hdr_size-4);
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
		this.data = stream.readUint8Array(this.size-this.hdr_size);
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

BoxParser.tfhdBox.prototype.parse = function(stream) {
	var readBytes = 0;
	this.parseFullHeader(stream);
	this.track_id = stream.readUint32();
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TFHD_FLAG_BASE_DATA_OFFSET)) {
		this.base_data_offset = stream.readUint64();
		readBytes += 8;
	} else {
		this.base_data_offset = 0;
	}
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DESC)) {
		this.default_sample_description_index = stream.readUint32();
		readBytes += 4;
	} else {
		this.default_sample_description_index = 0;
	}
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TFHD_FLAG_SAMPLE_DUR)) {
		this.default_sample_duration = stream.readUint32();
		readBytes += 4;
	} else {
		this.default_sample_duration = 0;
	}
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TFHD_FLAG_SAMPLE_SIZE)) {
		this.default_sample_size = stream.readUint32();
		readBytes += 4;
	} else {
		this.default_sample_size = 0;
	}
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TFHD_FLAG_SAMPLE_FLAGS)) {
		this.default_sample_flags = stream.readUint32();
		readBytes += 4;
	} else {
		this.default_sample_flags = 0;
	}
}

BoxParser.trunBox.prototype.parse = function(stream) {
	var readBytes = 0;
	this.parseFullHeader(stream);
	this.sample_count = stream.readUint32();
	readBytes+= 4;
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TRUN_FLAGS_DATA_OFFSET) ) {
		this.data_offset = stream.readInt32(); //signed
		readBytes += 4;
	} else {
		this.data_offset = 0;
	}
	if (this.size - this.hdr_size > readBytes && (this.flags & BoxParser.TRUN_FLAGS_FIRST_FLAG) ) {
		this.first_sample_flags = stream.readUint32();
		readBytes += 4;
	} else {
		this.first_sample_flags = 0;
	}
	this.sample_duration = [];
	this.sample_size = [];
	this.sample_flags = [];
	this.sample_composition_time_offset = [];
	if (this.size - this.hdr_size > readBytes) {
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

BoxParser.vttCBox.prototype.parse = function(stream) {
	this.text = stream.readString(this.size - this.hdr_size);
}

BoxParser.paylBox.prototype.parse = BoxParser.vttCBox.prototype.parse;

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

BoxParser.sidxBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.reference_ID = stream.readUint32();
	this.timescale = stream.readUint32();
	if (this.version === 0) {
		this.earliest_presentation_time = stream.readUint32();
		this.first_offset = stream.readUint32();
	} else {
		this.earliest_presentation_time = stream.readUint64();
		this.first_offset = stream.readUint64();
	}
	stream.readUint16();
	this.references = [];
	var count = stream.readUint16();
	for (var i = 0; i < count; i++) {
		var ref = {};
		this.references.push(ref);
		var tmp_32 = stream.readUint32();
		ref.reference_type = (tmp_32 >> 31) & 0x1;
		ref.referenced_size = tmp_32 & 0x7FFFFFFF;
		ref.subsegment_duration = stream.readUint32();
		tmp_32 = stream.readUint32();
		ref.starts_with_SAP = (tmp_32 >> 31) & 0x1;
		ref.SAP_type = (tmp_32 >> 28) & 0x7;
		ref.SAP_delta_time = tmp_32 & 0xFFFFFFF;
	}
}

BoxParser.emsgBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.scheme_id_uri 				= stream.readCString();
	this.value 						= stream.readCString();
	this.timescale 					= stream.readUint32();
	this.presentation_time_delta 	= stream.readUint32();
	this.event_duration			 	= stream.readUint32();
	this.id 						= stream.readUint32();
	var message_size = this.size - this.hdr_size - (4*4 + (this.scheme_id_uri.length+1) + (this.value.length+1));
	this.message_data = stream.readUint8Array(message_size);
}

BoxParser.prftBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.ref_track_id = stream.readUint32();
	this.ntp_timestamp = stream.readUint64();
	if (this.version === 0) {
		this.media_time = stream.readUint32();
	} else {
		this.media_time = stream.readUint64();
	}
}

BoxParser.psshBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.system_id = stream.readUint8Array(16);
	if (this.version > 0) {
		var count = stream.readUint32();
		this.kid = [];
		for (var i = 0; i < count; i++) {
			this.kid[i] = stream.readUint8Array(16);
		}
	} 
	var datasize = stream.readUint32();
	this.data = stream.readUint8Array(datasize);
}

BoxParser.elstBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.entries = [];
	var entry_count = stream.readUint32();
	for (var i = 0; i < entry_count; i++) {
		var entry = {};
		this.entries.push(entry);
		if (this.version === 1) {
			entry.segment_duration = stream.readUint64();
			entry.media_time = stream.readInt64();
		} else {
			entry.segment_duration = stream.readUint32();
			entry.media_time = stream.readInt32();
		}
		entry.media_rate_integer = stream.readInt16();
		entry.media_rate_fraction = stream.readInt16();
	}
}

BoxParser.sbgpBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.grouping_type = stream.readString(4);
	if (this.version === 1) {
		this.grouping_type_parameter = stream.readUint32();
	}
	this.entries = [];
	var entry_count = stream.readUint32();
	for (var i = 0; i < entry_count; i++) {
		var entry = {};
		this.entries.push(entry);
		entry.sample_count = stream.readInt32();
		entry.group_description_index = stream.readInt32();
	}
}

BoxParser.sgpdBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.grouping_type = stream.readString(4);
	Log.debug("BoxParser", "Found Sample Groups of type "+this.grouping_type);
	if (this.version === 1) {
		this.default_length = stream.readUint32();
	}
	if (this.version >= 2) {
		this.default_sample_description_index = stream.readUint32();
	}
	this.entries = [];
	var entry_count = stream.readUint32();
	for (var i = 0; i < entry_count; i++) {
		var entry;
		if (BoxParser[this.grouping_type+"SampleGroupEntry"]) {
			entry = new BoxParser[this.grouping_type+"SampleGroupEntry"](this.grouping_type);	
		}  else {
			entry = new BoxParser.SampleGroupEntry(this.grouping_type);	
		}
		this.entries.push(entry);
		if (this.version === 1) {
			if (this.default_length === 0) {
				entry.description_length = stream.readUint32();
			}
		}
		entry.parse(stream, this.default_length || entry.description_length);
	}
}

BoxParser.drefBox.prototype.parse = function(stream) {
	var ret;
	this.parseFullHeader(stream);
	this.entries = [];
	var entry_count = stream.readUint32();
	for (var i = 0; i < entry_count; i++) {
		ret = BoxParser.parseOneBox(stream, false);
		box = ret.box;
		this.entries.push(box);
	}
}

BoxParser["url Box"].prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.flags !== 0x000001) {
		this.location = stream.readCString();
	} else if (this.size - this.hdr_size) {
		Log.warn("BoxParser", "Invalid urlBox - contains data but flag not set");
		this.location = stream.readString(this.size - this.hdr_size);
	}
}

BoxParser["urn Box"].prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.name = stream.readCString();
	if (this.size - this.hdr_size - this.name.length - 1 > 0) {
		this.location = stream.readCString();
	}
}

BoxParser.TrackReferenceTypeBox = function(type, size, hdr_size, start, fileStart) {
	BoxParser.Box.call(this, type, size);
	this.hdr_size = hdr_size;
	this.start = start;
	this.fileStart = fileStart;
}
BoxParser.TrackReferenceTypeBox.prototype = new BoxParser.Box();
BoxParser.TrackReferenceTypeBox.prototype.parse = function(stream) {
	this.track_ids = stream.readUint32Array((this.size-this.hdr_size)/4);
}

BoxParser.trefBox.prototype.parse = function(stream) {
	var ret;
	var box;
	while (stream.position < this.start+this.size) {
		ret = BoxParser.parseOneBox(stream, true);
		box = new BoxParser.TrackReferenceTypeBox(ret.type, ret.size, ret.hdr_size, ret.start, ret.fileStart);
		box.parse(stream);
		this.boxes.push(box);
	}
}

BoxParser.SampleGroupEntry.prototype.parse = function(stream, length) {
	Log.warn("BoxParser", "Unknown Sample Group type: "+this.grouping_type);
	this.data =  stream.readUint8Array(length);
}

BoxParser.rollSampleGroupEntry.prototype.parse = function(stream, length) {
	this.roll_distance = stream.readInt16();
}

BoxParser.prolSampleGroupEntry.prototype.parse = BoxParser.rollSampleGroupEntry.prototype.parse;

BoxParser.avssSampleGroupEntry.prototype.parse = function(stream, length) {
	this.subSequenceIdentifier = stream.readUint16();
	this.layerNumber = stream.readUint8();
	var tmp_byte = stream.readUint8();
	this.durationFlag = tmp_byte >> 7;
	this.avgRateFlag = (tmp_byte >> 6) & 0x1;
	if (this.durationFlag) {
		this.duration = stream.readUint32();
	}
	if (this.avgRateFlag) {
		this.accurateStatisticsFlag = stream.readUint8();
		this.avgBitRate = stream.readUint16();
		this.avgFrameRate = stream.readUint16();
	}
	this.dependency = [];
	var numReferences = stream.readUint8();
	for (var i = 0; i < numReferences; i++) {
		var dependencyInfo = {};
		this.dependency.push(dependencyInfo);
		dependencyInfo.subSeqDirectionFlag = stream.readUint8();
		dependencyInfo.layerNumber = stream.readUint8();
		dependencyInfo.subSequenceIdentifier = stream.readUint16();
	}
}

BoxParser.avllSampleGroupEntry.prototype.parse = function(stream, length) {
	this.layerNumber = stream.readUint8();
	this.accurateStatisticsFlag = stream.readUint8();
	this.avgBitRate = stream.readUint16();
	this.avgFrameRate = stream.readUint16();
}

BoxParser.syncSampleGroupEntry.prototype.parse = function(stream, length) {
	var tmp_byte = stream.readUint8();
	this.NAL_unit_type = tmp_byte & 0x3F;
}

BoxParser.tsclSampleGroupEntry.prototype.parse = function(stream, length) {
	Log.warn("BoxParser", "Sample Group type: "+this.grouping_type+" not fully parsed");
	this.data =  stream.readUint8Array(length);
}

BoxParser.tsasSampleGroupEntry.prototype.parse = function(stream, length) {
	Log.warn("BoxParser", "Sample Group type: "+this.grouping_type+" not fully parsed");
	this.data =  stream.readUint8Array(length);
}

BoxParser.stsaSampleGroupEntry.prototype.parse = function(stream, length) {
	Log.warn("BoxParser", "Sample Group type: "+this.grouping_type+" not fully parsed");
	this.data =  stream.readUint8Array(length);
}

BoxParser.scifSampleGroupEntry.prototype.parse = function(stream, length) {
	Log.warn("BoxParser", "Sample Group type: "+this.grouping_type+" not fully parsed");
	this.data =  stream.readUint8Array(length);
}

BoxParser.mvifSampleGroupEntry.prototype.parse = function(stream, length) {
	Log.warn("BoxParser", "Sample Group type: "+this.grouping_type+" not fully parsed");
	this.data =  stream.readUint8Array(length);
}

BoxParser.scnmSampleGroupEntry.prototype.parse = function(stream, length) {
	Log.warn("BoxParser", "Sample Group type: "+this.grouping_type+" not fully parsed");
	this.data =  stream.readUint8Array(length);
}

BoxParser.dtrtSampleGroupEntry.prototype.parse = function(stream, length) {
	Log.warn("BoxParser", "Sample Group type: "+this.grouping_type+" not fully parsed");
	this.data =  stream.readUint8Array(length);
}

BoxParser.viprSampleGroupEntry.prototype.parse = function(stream, length) {
	Log.warn("BoxParser", "Sample Group type: "+this.grouping_type+" not fully parsed");
	this.data =  stream.readUint8Array(length);
}

BoxParser.teleSampleGroupEntry.prototype.parse = function(stream, length) {
	var tmp_byte = stream.readUint8();
	this.level_independently_decodable = tmp_byte >> 7;
}

BoxParser["rap SampleGroupEntry"].prototype.parse = function(stream, length) {
	var tmp_byte = stream.readUint8();
	this.num_leading_samples_known = tmp_byte >> 7;
	this.num_leading_samples = tmp_byte & 0x7F;
}

BoxParser.rashSampleGroupEntry.prototype.parse = function(stream, length) {
	this.operation_point_count = stream.readUint16();
	if (length !== 2+(this.operation_point_count === 1?2:this.operation_point_count*6)+9) {
		Log.warn("BoxParser", "Mismatch in "+this.grouping_type+" sample group length");
		this.data =  stream.readUint8Array(length-2);
	} else {
		if (this.operation_point_count === 1) {
			this.target_rate_share = stream.readUint16();
		} else {
			this.target_rate_share = [];
			this.available_bitrate = [];
			for (var i = 0; i < this.operation_point_count; i++) {
				this.available_bitrate[i] = stream.readUint32();
				this.target_rate_share[i] = stream.readUint16();
			}
		}
		this.maximum_bitrate = stream.readUint32();
		this.minimum_bitrate = stream.readUint32();
		this.discard_priority = stream.readUint8();
	}
}

BoxParser.alstSampleGroupEntry.prototype.parse = function(stream, length) {
	var i;
	var roll_count = stream.readUint16();
	this.first_output_sample = stream.readUint16();
	this.sample_offset = [];
	for (i = 0; i < roll_count; i++) {
		this.sample_offset[i] = stream.readUint32();
	}
	var remaining = length - 4 - 4*roll_count;
	this.num_output_samples = [];
	this.num_total_samples = [];
	for (i = 0; i < remaining/4; i++) {
		this.num_output_samples[i] = stream.readUint16();
		this.num_total_samples[i] = stream.readUint16();
	}
}

BoxParser.cprtBox.prototype.parse = function (stream) {
	this.parseFullHeader(stream);
	this.parseLanguage(stream);
	this.notice = stream.readCString();
	if (stream.position > this.start+this.size) {
		Log.warn("BoxParser", "Parsed more than the size of the box (null-terminated string problem?)");
		stream.seek(this.start+this.size);
	}
}

BoxParser["rtp Box"].prototype.parse = function(stream) {
	this.descriptionformat = stream.readString(4);
	this.sdptext = stream.readString(this.size - this.hdr_size - 4);
}

BoxParser["sdp Box"].prototype.parse = function(stream) {
	this.sdptext = stream.readString(this.size - this.hdr_size);
}

BoxParser.btrtBox.prototype.parse = function(stream) {
	this.bufferSizeDB = stream.readUint32();
	this.maxBitrate = stream.readUint32();
	this.avgBitrate = stream.readUint32();
}

BoxParser.ssixBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.subsegments = [];
	var subsegment_count = stream.readUint32();
	for (var i = 0; i < subsegment_count; i++) {
		var subsegment = {};
		this.subsegments.push(subsegment);
		subsegment.ranges = [];
		var range_count = stream.readUint32();
		for (var j = 0; j < range_count; j++) {
			var range = {};
			subsegment.ranges.push(range);
			range.level = stream.readUint8();
			range.range_size = stream.readUint24();
		}
	}
}

BoxParser.tfraBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.track_ID = stream.readUint32();
	stream.readUint24();
	var tmp_byte = stream.readUint8();
	this.length_size_of_traf_num = (tmp_byte >> 4) & 0x3;
	this.length_size_of_trun_num = (tmp_byte >> 2) & 0x3;
	this.length_size_of_sample_num = (tmp_byte) & 0x3;
	this.entries = [];
	var number_of_entries = stream.readUint32();
	for (var i = 0; i < number_of_entries; i++) {
		if (this.version === 1) {
			this.time = stream.readUint64();
			this.moof_offset = stream.readUint64();
		} else {
			this.time = stream.readUint32();
			this.moof_offset = stream.readUint32();
		}
		this.traf_number = stream["readUint"+(8*(this.length_size_of_traf_num+1))]();
		this.trun_number = stream["readUint"+(8*(this.length_size_of_trun_num+1))]();
		this.sample_number = stream["readUint"+(8*(this.length_size_of_sample_num+1))]();
	}
}

BoxParser.mfroBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.size = stream.readUint32();
}

BoxParser.pdinBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	var count = (this.size - this.hdr_size)/8;
	this.rate = [];
	this.initial_delay = [];
	for (var i = 0; i < count; i++) {
		this.rate[i] = stream.readUint32();
		this.initial_delay[i] = stream.readUint32();
	}
}

BoxParser.tselBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.switch_group = stream.readUint32();
	var count = (this.size - this.hdr_size - 4)/4;
	this.attribute_list = [];
	for (var i = 0; i < count; i++) {
		this.attribute_list[i] = stream.readUint32();
	}
}

BoxParser.trepBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.track_ID = stream.readUint32();
	this.boxes = [];
	while (stream.position < this.start+this.size) {
		ret = BoxParser.parseOneBox(stream);
		box = ret.box;
		this.boxes.push(box);
	}
}

BoxParser.levaBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	var count = stream.readUint8();
	this.levels = [];
	for (var i = 0; i < count; i++) {
		var level = {};
		this.levels[i] = level;
		level.track_ID = stream.readUint32();
		var tmp_byte = stream.readUint8();
		level.padding_flag = tmp_byte >> 7;
		level.assignment_type = tmp_byte & 0x7F;
		switch (level.assignment_type) {
			case 0:
				level.grouping_type = stream.readUint32();
				break;
			case 1:
				level.grouping_type = stream.readUint32();
				level.grouping_type_parameter = stream.readUint32();
				break;
			case 2:
				break;
			case 3:
				break;
			case 4:
				level.sub_track_id = stream.readUint32();
				break;
			default:
				Log.warn("BoxParser", "Unknown leva assignement type");
		}
	}
}

BoxParser.striBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.switch_group = stream.readUint16();
	this.alternate_group = stream.readUint16();
	this.sub_track_id = stream.readUint32();
	var count = (this.size - this.hdr_size - 8)/4;
	this.attribute_list = [];
	for (var i = 0; i < count; i++) {
		this.attribute_list[i] = stream.readUint32();
	}
}

BoxParser.stsgBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.grouping_type = stream.readUint32();
	var count = stream.readUint16();
	this.group_description_index = [];
	for (var i = 0; i < count; i++) {
		this.group_description_index[i] = stream.readUint32();
	}
}

BoxParser.frmaBox.prototype.parse = function(stream) {
	this.data_format = stream.readString(4);
}

BoxParser.schmBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.scheme_type = stream.readString(4);
	this.scheme_version = stream.readUint32();
	if (this.flags & 0x000001) {
		this.scheme_uri = stream.readString(this.size - this.hdr_size - 8);
	}
}

BoxParser.trpyBox.prototype.parse = function(stream) {
	this.bytessent = stream.readUint64();
}
BoxParser.tpylBox.prototype.parse = BoxParser.trpyBox.prototype.parse;
BoxParser.dmedBox.prototype.parse = BoxParser.trpyBox.prototype.parse;
BoxParser.dimmBox.prototype.parse = BoxParser.trpyBox.prototype.parse;
BoxParser.drepBox.prototype.parse = BoxParser.trpyBox.prototype.parse;

BoxParser.numpBox.prototype.parse = function(stream) {
	this.packetssent = stream.readUint64();
}

BoxParser.totlBox.prototype.parse = function(stream) {
	this.bytessent = stream.readUint32();
}
BoxParser.tpayBox.prototype.parse = BoxParser.totlBox.prototype.parse;

BoxParser.npckBox.prototype.parse = function(stream) {
	this.packetssent = stream.readUint32();
}

BoxParser.maxrBox.prototype.parse = function(stream) {
	this.period = stream.readUint32();
	this.bytes = stream.readUint32();
}

BoxParser.tminBox.prototype.parse = function(stream) {
	this.time = stream.readUint32();
}
BoxParser.tmaxBox.prototype.parse = BoxParser.tminBox.prototype.parse;
BoxParser.dmaxBox.prototype.parse = BoxParser.tminBox.prototype.parse;

BoxParser.pmaxBox.prototype.parse = function(stream) {
	this.bytes = stream.readUint32();
}

BoxParser.paytBox.prototype.parse = function(stream) {
	this.payloadID = stream.readUint32();
	var count = stream.readUint8();
	this.rtpmap_string = stream.readString(count);
}

BoxParser.stviBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	var tmp32 = stream.readUint32();
	this.single_view_allowed = tmp32 & 0x3;
	this.stereo_scheme = stream.readUint32();
	var length = stream.readUint32();
	this.stereo_indication_type = stream.readString(length);
	var ret;
	var box;
	this.boxes = [];
	while (stream.position < this.start+this.size) {
		ret = BoxParser.parseOneBox(stream, false);
		box = ret.box;
		this.boxes.push(box);
		this[box.type] = box;
	}		
}

BoxParser.padbBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	var sample_count = stream.readUint32();
	this.padbits = [];
	for (var i = 0; i < Math.floor((sample_count+1)/2); i++) {
		this.padbits = stream.readUint8();
	}
}

BoxParser.TrackGroupTypeBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	this.track_group_id = stream.readUint32();
}

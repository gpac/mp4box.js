var mp4boxParser = {
	boxes : [ "mdat", "vmhd", "dref" ],
	fullBoxes : [ "mvhd", "tkhd", "mdhd", "hdlr", "smhd", "hmhd", "nhmd", "url ", "urn ", /*stsd: special case */,
				  "ctts", "stco", "co64", "stsc", "stss", "stsz", "stz2", "stts", "stsh" ],
	containerBoxes : [ 
		[ "moov", [ "trak" ] ],
		[ "trak" ],
		[ "mdia" ],
		[ "minf" ],
		[ "dinf" ],
		[ "stbl" ],
	],
	sampleDescriptions : [ "metx", "mett", "urim" ],
	initialize: function() {
		var i;
		var length;
		mp4boxParser.FullBox.prototype = new mp4boxParser.Box();
		mp4boxParser.basicContainerBox.prototype = new mp4boxParser.Box();
		mp4boxParser.stsdBox.prototype = new mp4boxParser.FullBox();
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
		length = mp4boxParser.sampleDescriptions.length;
		for (i=0; i<length; i++) {
			mp4boxParser[mp4boxParser.sampleDescriptions[i]+"Box"] = (function (j) { 
				return function(size) {
					mp4boxParser.Box.call(this, mp4boxParser.sampleDescriptions[j], size);
				}
			})(i);
			mp4boxParser[mp4boxParser.sampleDescriptions[i]+"Box"].prototype = new mp4boxParser.Box();
		}

	},
	ISOFile: function() {
		this.boxes = new Array();
		this.mdats = new Array();
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
	stsdBox: function(size) {
		mp4boxParser.FullBox.call(this, "stsd", size);
		this.entries = new Array();
	},
	parseOneBox: function(stream) {
		var box;
		var start = stream.position;
		var hdr_size = 0;
		var size = stream.readUint32();
		var type = stream.readString(4);
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
			return MP4Fragmenter.NOT_ENOUGH_DATA;
		}
		if (mp4boxParser[type+"Box"]) {
			box = new mp4boxParser[type+"Box"](size - hdr_size);		
		} else {
			box = new mp4boxParser.Box(type, size - hdr_size);
		}
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
		this.boxes.push(box);
		// if (this.subBoxNames && this.subBoxNames.indexOf(box.type) != -1) {
			// this[box.type+"s"].push(box);
		// } else {
			// this[box.type] = box;
		// }
	}
}

mp4boxParser.mvhdBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.version == 1) {
		stream.readUint64();
		stream.readUint64();
		this.timescale = stream.readUint32();
		this.duration = stream.readUint64();
	} else {
		stream.readUint32();
		stream.readUint32();
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

mp4boxParser.tkhdBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.version == 1) {
		stream.readUint64();
		stream.readUint64();
		this.track_id = stream.readUint32();
		stream.readUint32();
		this.duration = stream.readUint64();
	} else {
		stream.readUint32();
		stream.readUint32();
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
		stream.readUint64();
		stream.readUint64();
		this.timescale = stream.readUint32();
		this.duration = stream.readUint64();
	} else {
		stream.readUint32();
		stream.readUint32();
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

mp4boxParser.stszBox.prototype.parse = function(stream) {
	var i;
	var sample_size;
	this.parseFullHeader(stream);
	this.sample_sizes = new Array();
	if (this.version == 0) {
		sample_size = stream.readUint32();
		this.sample_count = stream.readUint32();
		if (sample_size == 0) {
			this.sample_sizes = stream.readUint32Array(this.sample_count);
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

mp4boxParser.ISOFile.prototype.parse = function(stream) {
	var box;
	while (!stream.isEof()) {
		box = mp4boxParser.parseOneBox(stream);
		this.boxes.push(box);
		// switch (box.type) {
			// case "mdat":
				// this.mdats.push(box);
				// break;
			// default:
				// this[box.type] = box;
				// break;
		// }
	}
}

/* TODO: fix endianness */
DataStream.prototype.readUint64 = function () {
	return (this.readUint32()<<32)+this.readUint32();
}

DataStream.prototype.readUint24 = function () {
	return (this.readUint8()<<16)+(this.readUint8()<<8)+this.readUint8();
}

DataStream.prototype.writeUint64 = function (v) {
	var h = (v >> 32);
	this.writeUint32(h);
	this.writeUint32(v & 0xFFFFFFFF);
}

DataStream.prototype.writeUint24 = function (v) {
	this.writeUint8((v & 0x00FF0000)>>16);
	this.writeUint8((v & 0x0000FF00)>>8);
	this.writeUint8((v & 0x000000FF));
}

var MAX_SIZE = Math.pow(2, 32);

mp4boxParser.Box.prototype.writeHeader = function(stream) {
	this.size += 8;
	if (this.size > MAX_SIZE) {
		this.size += 8;
	}
	console.log("writing "+this.type+" size: "+this.size);
	if (this.size > MAX_SIZE) {
		stream.writeUint32(1);
	} else {
		stream.writeUint32(this.size);
	}
	stream.writeString(this.type, null, 4);
	if (this.size > MAX_SIZE) {
		stream.writeUint64(this.size);
	} 
}

mp4boxParser.FullBox.prototype.writeHeader = function(stream) {
	this.size += 4;
	mp4boxParser.Box.prototype.writeHeader.call(this, stream);
	stream.writeUint8(this.version);
	stream.writeUint24(this.flags);
}

mp4boxParser.Box.prototype.write = function(stream) {
	this.writeHeader(stream);
	if (this.data) {
		stream.writeUint8Array(this.data);
	}
}

mp4boxParser.ISOFile.prototype.write = function(stream) {
	// for (key in this) {
		// if (this[key]["write"]) {
			// this[key].write(stream);
		// } 
	// }
	// for (var i=0; i<this.mdats.length; i++) {
		// this.mdats[i].write(stream);
	// }
	for (var i=0; i<this.boxes.length; i++) {
		this.boxes[i].write(stream);
	}
}

mp4boxParser.basicContainerBox.prototype.write = function(stream) {
	this.writeHeader(stream);
	// for (key in this) {
		// if (this[key]["write"]) {
			// this[key].write(stream);
		// } else if (Object.prototype.toString.call( this[key] ) === '[object Array]') {
			// if (this[key].length && this[key][0]["write"]) {
				// for (var i=0; i<this[key].length; i++) {
					// this[key][i].write(stream);
				// }
			// }
		// }
	// }
	for (var i=0; i<this.boxes.length; i++) {
		this.boxes[i].write(stream);
	}
}

mp4boxParser.mvhdBox.prototype.write = function(stream) {
	this.writeHeader(stream);
	stream.writeUint32(0);
	stream.writeUint32(0);
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
	this.writeHeader(stream);
	stream.writeUint32(0);
	stream.writeUint32(0);
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
	this.writeHeader(stream);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint32(this.timescale);
	stream.writeUint32(this.duration);
	stream.writeUint16(this.language);
	stream.writeUint16(0);
}

mp4boxParser.hdlrBox.prototype.write = function(stream) {
	this.version = 0;
	this.writeHeader(stream);
	stream.writeUint32(0);
	stream.writeString(this.handler);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeUint32(0);
	stream.writeCString(this.name);
}

mp4boxParser.stsdBox.prototype.write = function(stream) {
	var i;
	this.writeHeader(stream);
	stream.writeUint32(this.entries.length);
	for (i = 0; i < this.entries.length; i++) {
		this.entries[i].write(stream);
	}
}

mp4boxParser.cttsBox.prototype.write = function(stream) {
	var i;
	this.version = 1;
	this.writeHeader(stream);
	stream.writeUint32(this.sample_counts.length);
	for(i=0; i<this.sample_counts.length; i++) {
		stream.writeUint32(this.sample_counts[i]);
		stream.writeInt32(this.sample_offsets[i]); /* signed */
	}
}

mp4boxParser.sttsBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.writeHeader(stream);
	stream.writeUint32(this.sample_counts.length);
	for(i=0; i<this.sample_counts.length; i++) {
		stream.writeUint32(this.sample_counts[i]);
		stream.writeUint32(this.sample_deltas[i]);
	}
}

mp4boxParser.stssBox.prototype.write = function(stream) {
	this.version = 0;
	this.writeHeader(stream);
	stream.writeUint32(this.sample_numbers.length);
	stream.writeUint32Array(this.sample_numbers);
}

mp4boxParser.stshBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.writeHeader(stream);
	stream.writeUint32(this.shadowed_sample_numbers.length);
	for(i=0; i<this.shadowed_sample_numbers.length; i++) {
		stream.writeUint32(this.shadowed_sample_numbers[i]);
		stream.writeUint32(this.sync_sample_numbers[i]);
	}
}

mp4boxParser.stcoBox.prototype.write = function(stream) {
	this.version = 0;
	this.writeHeader(stream);
	stream.writeUint32(this.chunk_offsets.length);
	stream.writeUint32Array(this.chunk_offsets);
}

mp4boxParser.co64Box.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.writeHeader(stream);
	stream.writeUint32(this.chunk_offsets.length);
	for(i=0; i<this.chunk_offsets.length; i++) {
		stream.writeUint64(this.chunk_offsets[i]);
	}
}

mp4boxParser.stscBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
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
	this.writeHeader(stream);
	stream.writeUint32(0);
	stream.writeUint32(this.sample_sizes.length);
	stream.writeUint32Array(this.sample_sizes);
}

function MP4Fragmenter() {
	this.inputStream = null;
	this.inputIsoFile = new mp4boxParser.ISOFile();
	this.outputStream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN);
	this.outputIsoFile = new mp4boxParser.ISOFile();
	this.buffer = null;
	this.onInit = null;
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

/**
 * Parse an ArrayBuffer as an ISOBMFF file, fragments it and calls back 
 *
 * @param {ArrayBuffer} ab The ArrayBuffer representing the file.
 * @see http://www.iso.org/iso/catalogue_detail.htm?csnumber=61988
 *     (ISO/IEC 14496-12:2012 section 8.16.3)
 */
MP4Fragmenter.prototype.fragment = function(ab) {
	this.inputStream = new DataStream(ab, 0, DataStream.BIG_ENDIAN);	
	this.inputIsoFile.parse(this.inputStream);
	this.inputIsoFile.write(this.outputStream);
	this.outputStream.save('output.mp4');
}

MP4Fragmenter.prototype.fragmentURL = function(url) {
	getfile(url, this.fragment.bind(this));
}

MP4Fragmenter.NOT_ENOUGH_DATA = 0;

function getfile(url, callback)
{
	var xhr = new XMLHttpRequest;
	xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";
    xhr.onreadystatechange = function (e) { 
		if (this.readyState == this.DONE) {
			callback(this.response); 
		}
	};
    xhr.send();
}
// file:src/log-simple.js
var Log = console;
Log.setLogLevel = function(level) {};
// file:src/stream.js
var MP4BoxStream = function(arrayBuffer) {
  if (arrayBuffer instanceof ArrayBuffer) {
    this.buffer = arrayBuffer;
    this.dataview = new DataView(arrayBuffer);
  } else {
    throw ("Needs an array buffer");
  }
  this.position = 0;
};

/*************************************************************************
  Common API between MultiBufferStream and SimpleStream
 *************************************************************************/
MP4BoxStream.prototype.getPosition = function() {
  return this.position;
}

MP4BoxStream.prototype.getEndPosition = function() {
  return this.buffer.byteLength;
}

MP4BoxStream.prototype.getLength = function() {
  return this.buffer.byteLength;
}

MP4BoxStream.prototype.seek = function (pos) {
  var npos = Math.max(0, Math.min(this.buffer.byteLength, pos));
  this.position = (isNaN(npos) || !isFinite(npos)) ? 0 : npos;
  return true;
}

MP4BoxStream.prototype.isEos = function () {
  return this.getPosition() >= this.getEndPosition();
}

/*************************************************************************
  Read methods, simimar to DataStream but simpler
 *************************************************************************/
MP4BoxStream.prototype.readAnyInt = function(size, signed) {
  var res = 0;
  if (this.position + size <= this.buffer.byteLength) {
    switch (size) {
      case 1:
        if (signed) {
          res = this.dataview.getInt8(this.position);
        } else {
          res = this.dataview.getUint8(this.position);
        }
        break;
      case 2:
        if (signed) {
          res = this.dataview.getInt16(this.position);
        } else {
          res = this.dataview.getUint16(this.position);
        }
        break;
      case 3:
        if (signed) {
          throw ("No method for reading signed 24 bits values");
        } else {
          res = this.dataview.getUint8(this.position) << 16;
          res |= this.dataview.getUint8(this.position+1) << 8;
          res |= this.dataview.getUint8(this.position+2);
        }
        break;
      case 4:
        if (signed) {
          res = this.dataview.getInt32(this.position);
        } else {
          res = this.dataview.getUint32(this.position);
        }
        break;
      case 8:
        if (signed) {
          throw ("No method for reading signed 64 bits values");
        } else {
          res = this.dataview.getUint32(this.position) << 32;
          res |= this.dataview.getUint32(this.position+4);
        }
        break;
      default:
        throw ("readInt method not implemented for size: "+size);
    }
    this.position+= size;
    return res;
  } else {
    throw ("Not enough bytes in buffer");
  }
}

MP4BoxStream.prototype.readUint8 = function() {
  return this.readAnyInt(1, false);
}

MP4BoxStream.prototype.readUint16 = function() {
  return this.readAnyInt(2, false);
}

MP4BoxStream.prototype.readUint24 = function() {
  return this.readAnyInt(3, false);
}

MP4BoxStream.prototype.readUint32 = function() {
  return this.readAnyInt(4, false);
}

MP4BoxStream.prototype.readUint64 = function() {
  return this.readAnyInt(8, false);
}

MP4BoxStream.prototype.readString = function(length) {
  if (this.position + length <= this.buffer.byteLength) {
    var s = "";
    for (var i = 0; i < length; i++) {
      s += String.fromCharCode(this.readUint8());
    }
    return s;
  } else {
    throw ("Not enough bytes in buffer");
  }
}

MP4BoxStream.prototype.readCString = function() {
  var arr = [];
  while(true) {
    var b = this.readUint8();
    if (b !== 0) {
      arr.push(b);
    } else {
      break;
    }
  }
  return String.fromCharCode.apply(null, arr); 
}

MP4BoxStream.prototype.readInt8 = function() {
  return this.readAnyInt(1, true);
}

MP4BoxStream.prototype.readInt16 = function() {
  return this.readAnyInt(2, true);
}

MP4BoxStream.prototype.readInt32 = function() {
  return this.readAnyInt(4, true);
}

MP4BoxStream.prototype.readInt64 = function() {
  return this.readAnyInt(8, false);
}

MP4BoxStream.prototype.readUint8Array = function(length) {
  var arr = new Uint8Array(length);
  for (var i = 0; i < length; i++) {
    arr[i] = this.readUint8();
  }
  return arr;
}

MP4BoxStream.prototype.readInt16Array = function(length) {
  var arr = new Int16Array(length);
  for (var i = 0; i < length; i++) {
    arr[i] = this.readInt16();
  }
  return arr;
}

MP4BoxStream.prototype.readUint16Array = function(length) {
  var arr = new Int16Array(length);
  for (var i = 0; i < length; i++) {
    arr[i] = this.readUint16();
  }
  return arr;
}

MP4BoxStream.prototype.readUint32Array = function(length) {
  var arr = new Uint32Array(length);
  for (var i = 0; i < length; i++) {
    arr[i] = this.readUint32();
  }
  return arr;
}

MP4BoxStream.prototype.readInt32Array = function(length) {
  var arr = new Int32Array(length);
  for (var i = 0; i < length; i++) {
    arr[i] = this.readInt32();
  }
  return arr;
}

if (typeof exports !== 'undefined') {
  exports.MP4BoxStream = MP4BoxStream;
}// file:src/box.js
/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var BoxParser = {
	ERR_INVALID_DATA : -1,
	ERR_NOT_ENOUGH_DATA : 0,
	OK : 1,

	// Boxes to be created with default parsing
	BASIC_BOXES: [ "mdat", "idat", "free", "skip", "meco", "strk" ],
	FULL_BOXES: [ "hmhd", "nmhd", "iods", "xml ", "bxml", "ipro", "mere" ],
	CONTAINER_BOXES: [
		[ "moov", [ "trak", "pssh" ] ],
		[ "trak" ],
		[ "edts" ],
		[ "mdia" ],
		[ "minf" ],
		[ "dinf" ],
		[ "stbl", [ "sgpd", "sbgp" ] ],
		[ "mvex", [ "trex" ] ],
		[ "moof", [ "traf" ] ],
		[ "traf", [ "trun", "sgpd", "sbgp" ] ],
		[ "vttc" ],
		[ "tref" ],
		[ "iref" ],
		[ "mfra", [ "tfra" ] ],
		[ "meco" ],
		[ "hnti" ],
		[ "hinf" ],
		[ "strk" ],
		[ "strd" ],
		[ "sinf" ],
		[ "rinf" ],
		[ "schi" ],
		[ "trgr" ],
		[ "udta", ["kind"] ],
		[ "iprp", ["ipma"] ],
		[ "ipco" ],
		[ "grpl" ],
		[ "j2kH" ],
		[ "etyp", [ "tyco"] ]
	],
	// Boxes effectively created
	boxCodes : [],
	fullBoxCodes : [],
	containerBoxCodes : [],
	sampleEntryCodes : {},
	sampleGroupEntryCodes: [],
	trackGroupTypes: [],
	UUIDBoxes: {},
	UUIDs: [],
	initialize: function() {
		BoxParser.FullBox.prototype = new BoxParser.Box();
		BoxParser.ContainerBox.prototype = new BoxParser.Box();
		BoxParser.SampleEntry.prototype = new BoxParser.Box();
		BoxParser.TrackGroupTypeBox.prototype = new BoxParser.FullBox();

		/* creating constructors for simple boxes */
		BoxParser.BASIC_BOXES.forEach(function(type) {
			BoxParser.createBoxCtor(type)
		});
		BoxParser.FULL_BOXES.forEach(function(type) {
			BoxParser.createFullBoxCtor(type);
		});
		BoxParser.CONTAINER_BOXES.forEach(function(types) {
			BoxParser.createContainerBoxCtor(types[0], null, types[1]);
		});
	},
	Box: function(_type, _size, _uuid) {
		this.type = _type;
		this.size = _size;
		this.uuid = _uuid;
	},
	FullBox: function(type, size, uuid) {
		BoxParser.Box.call(this, type, size, uuid);
		this.flags = 0;
		this.version = 0;
	},
	ContainerBox: function(type, size, uuid) {
		BoxParser.Box.call(this, type, size, uuid);
		this.boxes = [];
	},
	SampleEntry: function(type, size, hdr_size, start) {
		BoxParser.ContainerBox.call(this, type, size);
		this.hdr_size = hdr_size;
		this.start = start;
	},
	SampleGroupEntry: function(type) {
		this.grouping_type = type;
	},
	TrackGroupTypeBox: function(type, size) {
		BoxParser.FullBox.call(this, type, size);
	},
	createBoxCtor: function(type, parseMethod){
		BoxParser.boxCodes.push(type);
		BoxParser[type+"Box"] = function(size) {
			BoxParser.Box.call(this, type, size);
		}
		BoxParser[type+"Box"].prototype = new BoxParser.Box();
		if (parseMethod) BoxParser[type+"Box"].prototype.parse = parseMethod;
	},
	createFullBoxCtor: function(type, parseMethod) {
		//BoxParser.fullBoxCodes.push(type);
		BoxParser[type+"Box"] = function(size) {
			BoxParser.FullBox.call(this, type, size);
		}
		BoxParser[type+"Box"].prototype = new BoxParser.FullBox();
		BoxParser[type+"Box"].prototype.parse = function(stream) {
			this.parseFullHeader(stream);
			if (parseMethod) {
				parseMethod.call(this, stream);
			}
		};
	},
	addSubBoxArrays: function(subBoxNames) {
		if (subBoxNames) {
			this.subBoxNames = subBoxNames;
			var nbSubBoxes = subBoxNames.length;
			for (var k = 0; k<nbSubBoxes; k++) {
				this[subBoxNames[k]+"s"] = [];
			}
		}
	},
	createContainerBoxCtor: function(type, parseMethod, subBoxNames) {
		//BoxParser.containerBoxCodes.push(type);
		BoxParser[type+"Box"] = function(size) {
			BoxParser.ContainerBox.call(this, type, size);
			BoxParser.addSubBoxArrays.call(this, subBoxNames);
		}
		BoxParser[type+"Box"].prototype = new BoxParser.ContainerBox();
		if (parseMethod) BoxParser[type+"Box"].prototype.parse = parseMethod;
	},
	createMediaSampleEntryCtor: function(mediaType, parseMethod, subBoxNames) {
		BoxParser.sampleEntryCodes[mediaType] = [];
		BoxParser[mediaType+"SampleEntry"] = function(type, size) {
			BoxParser.SampleEntry.call(this, type, size);
			BoxParser.addSubBoxArrays.call(this, subBoxNames);
		};
		BoxParser[mediaType+"SampleEntry"].prototype = new BoxParser.SampleEntry();
		if (parseMethod) BoxParser[mediaType+"SampleEntry"].prototype .parse = parseMethod;
	},
	createSampleEntryCtor: function(mediaType, type, parseMethod, subBoxNames) {
		BoxParser.sampleEntryCodes[mediaType].push(type);
		BoxParser[type+"SampleEntry"] = function(size) {
			BoxParser[mediaType+"SampleEntry"].call(this, type, size);
			BoxParser.addSubBoxArrays.call(this, subBoxNames);
		};
		BoxParser[type+"SampleEntry"].prototype = new BoxParser[mediaType+"SampleEntry"]();
		if (parseMethod) BoxParser[type+"SampleEntry"].prototype.parse = parseMethod;
	},
	createEncryptedSampleEntryCtor: function(mediaType, type, parseMethod) {
		BoxParser.createSampleEntryCtor.call(this, mediaType, type, parseMethod, ["sinf"]);
	},
	createSampleGroupCtor: function(type, parseMethod) {
		//BoxParser.sampleGroupEntryCodes.push(type);
		BoxParser[type+"SampleGroupEntry"] = function(size) {
			BoxParser.SampleGroupEntry.call(this, type, size);
		}
		BoxParser[type+"SampleGroupEntry"].prototype = new BoxParser.SampleGroupEntry();
		if (parseMethod) BoxParser[type+"SampleGroupEntry"].prototype.parse = parseMethod;
	},
	createTrackGroupCtor: function(type, parseMethod) {
		//BoxParser.trackGroupTypes.push(type);
		BoxParser[type+"TrackGroupTypeBox"] = function(size) {
			BoxParser.TrackGroupTypeBox.call(this, type, size);
		}
		BoxParser[type+"TrackGroupTypeBox"].prototype = new BoxParser.TrackGroupTypeBox();
		if (parseMethod) BoxParser[type+"TrackGroupTypeBox"].prototype.parse = parseMethod;
	},
	createUUIDBox: function(uuid, isFullBox, isContainerBox, parseMethod) {
		BoxParser.UUIDs.push(uuid);
		BoxParser.UUIDBoxes[uuid] = function(size) {
			if (isFullBox) {
				BoxParser.FullBox.call(this, "uuid", size, uuid);
			} else {
				if (isContainerBox) {
					BoxParser.ContainerBox.call(this, "uuid", size, uuid);
				} else {
					BoxParser.Box.call(this, "uuid", size, uuid);
				}
			}
		}
		BoxParser.UUIDBoxes[uuid].prototype = (isFullBox ? new BoxParser.FullBox() : (isContainerBox ? new BoxParser.ContainerBox() : new BoxParser.Box()));
		if (parseMethod) {
			if (isFullBox) {
				BoxParser.UUIDBoxes[uuid].prototype.parse = function(stream) {
					this.parseFullHeader(stream);
					if (parseMethod) {
						parseMethod.call(this, stream);
					}
				}
			} else {
				BoxParser.UUIDBoxes[uuid].prototype.parse = parseMethod;
			}
		}
	}
}

BoxParser.initialize();

BoxParser.TKHD_FLAG_ENABLED    = 0x000001;
BoxParser.TKHD_FLAG_IN_MOVIE   = 0x000002;
BoxParser.TKHD_FLAG_IN_PREVIEW = 0x000004;

BoxParser.TFHD_FLAG_BASE_DATA_OFFSET	= 0x01;
BoxParser.TFHD_FLAG_SAMPLE_DESC			= 0x02;
BoxParser.TFHD_FLAG_SAMPLE_DUR			= 0x08;
BoxParser.TFHD_FLAG_SAMPLE_SIZE			= 0x10;
BoxParser.TFHD_FLAG_SAMPLE_FLAGS		= 0x20;
BoxParser.TFHD_FLAG_DUR_EMPTY			= 0x10000;
BoxParser.TFHD_FLAG_DEFAULT_BASE_IS_MOOF= 0x20000;

BoxParser.TRUN_FLAGS_DATA_OFFSET= 0x01;
BoxParser.TRUN_FLAGS_FIRST_FLAG	= 0x04;
BoxParser.TRUN_FLAGS_DURATION	= 0x100;
BoxParser.TRUN_FLAGS_SIZE		= 0x200;
BoxParser.TRUN_FLAGS_FLAGS		= 0x400;
BoxParser.TRUN_FLAGS_CTS_OFFSET	= 0x800;

BoxParser.Box.prototype.add = function(name) {
	return this.addBox(new BoxParser[name+"Box"]());
}

BoxParser.Box.prototype.addBox = function(box) {
	this.boxes.push(box);
	if (this[box.type+"s"]) {
		this[box.type+"s"].push(box);
	} else {
		this[box.type] = box;
	}
	return box;
}

BoxParser.Box.prototype.set = function(prop, value) {
	this[prop] = value;
	return this;
}

BoxParser.Box.prototype.addEntry = function(value, _prop) {
	var prop = _prop || "entries";
	if (!this[prop]) {
		this[prop] = [];
	}
	this[prop].push(value);
	return this;
}

if (typeof exports !== "undefined") {
	exports.BoxParser = BoxParser;
}
// file:src/box-parse.js
/* 
 * Copyright (c) Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
BoxParser.parseUUID = function(stream) {
	return BoxParser.parseHex16(stream);
}

BoxParser.parseHex16 = function(stream) {
	var hex16 = ""
	for (var i = 0; i <16; i++) {
		var hex = stream.readUint8().toString(16);
		hex16 += (hex.length === 1 ? "0"+hex : hex);
	}
	return hex16;
}

BoxParser.parseOneBox = function(stream, headerOnly, parentSize) {
	var box;
	var start = stream.getPosition();
	var hdr_size = 0;
	var diff;
	var uuid;
	if (stream.getEndPosition() - start < 8) {
		Log.debug("BoxParser", "Not enough data in stream to parse the type and size of the box");
		return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
	}
	if (parentSize && parentSize < 8) {
		Log.debug("BoxParser", "Not enough bytes left in the parent box to parse a new box");
		return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
	}
	var size = stream.readUint32();
	var type = stream.readString(4);
	var box_type = type;
	Log.debug("BoxParser", "Found box of type '"+type+"' and size "+size+" at position "+start);
	hdr_size = 8;
	if (type == "uuid") {
		if ((stream.getEndPosition() - stream.getPosition() < 16) || (parentSize -hdr_size < 16)) {
			stream.seek(start);
			Log.debug("BoxParser", "Not enough bytes left in the parent box to parse a UUID box");
			return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
		}
		uuid = BoxParser.parseUUID(stream);
		hdr_size += 16;
		box_type = uuid;
	}
	if (size == 1) {
		if ((stream.getEndPosition() - stream.getPosition() < 8) || (parentSize && (parentSize - hdr_size) < 8)) {
			stream.seek(start);
			Log.warn("BoxParser", "Not enough data in stream to parse the extended size of the \""+type+"\" box");
			return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
		}
		size = stream.readUint64();
		hdr_size += 8;
	} else if (size === 0) {
		/* box extends till the end of file or invalid file */
		if (parentSize) {
			size = parentSize;
		} else {
			/* box extends till the end of file */
			if (type !== "mdat") {
				Log.error("BoxParser", "Unlimited box size not supported for type: '"+type+"'");
				box = new BoxParser.Box(type, size);
				return { code: BoxParser.OK, box: box, size: box.size };
			}
		}
	}
	if (size !== 0 && size < hdr_size) {
		Log.error("BoxParser", "Box of type "+type+" has an invalid size "+size+" (too small to be a box)");
		return { code: BoxParser.ERR_NOT_ENOUGH_DATA, type: type, size: size, hdr_size: hdr_size, start: start };
	}
	if (size !== 0 && parentSize && size > parentSize) {
		Log.error("BoxParser", "Box of type '"+type+"' has a size "+size+" greater than its container size "+parentSize);
		return { code: BoxParser.ERR_NOT_ENOUGH_DATA, type: type, size: size, hdr_size: hdr_size, start: start };
	}
	if (size !== 0 && start + size > stream.getEndPosition()) {
		stream.seek(start);
		Log.info("BoxParser", "Not enough data in stream to parse the entire '"+type+"' box");
		return { code: BoxParser.ERR_NOT_ENOUGH_DATA, type: type, size: size, hdr_size: hdr_size, start: start };
	}
	if (headerOnly) {
		return { code: BoxParser.OK, type: type, size: size, hdr_size: hdr_size, start: start };
	} else {
		if (BoxParser[type+"Box"]) {
			box = new BoxParser[type+"Box"](size);
		} else {
			if (type !== "uuid") {
				Log.warn("BoxParser", "Unknown box type: '"+type+"'");
				box = new BoxParser.Box(type, size);
				box.has_unparsed_data = true;
			} else {
				if (BoxParser.UUIDBoxes[uuid]) {
					box = new BoxParser.UUIDBoxes[uuid](size);
				} else {
					Log.warn("BoxParser", "Unknown uuid type: '"+uuid+"'");
					box = new BoxParser.Box(type, size);
					box.uuid = uuid;
					box.has_unparsed_data = true;
				}
			}
		}
	}
	box.hdr_size = hdr_size;
	/* recording the position of the box in the input stream */
	box.start = start;
	if (box.write === BoxParser.Box.prototype.write && box.type !== "mdat") {
		Log.info("BoxParser", "'"+box_type+"' box writing not yet implemented, keeping unparsed data in memory for later write");
		box.parseDataAndRewind(stream);
	}
	box.parse(stream);
	diff = stream.getPosition() - (box.start+box.size);
	if (diff < 0) {
		Log.warn("BoxParser", "Parsing of box '"+box_type+"' did not read the entire indicated box data size (missing "+(-diff)+" bytes), seeking forward");
		stream.seek(box.start+box.size);
	} else if (diff > 0) {
		Log.error("BoxParser", "Parsing of box '"+box_type+"' read "+diff+" more bytes than the indicated box data size, seeking backwards");
		if (box.size !== 0) stream.seek(box.start+box.size);
	}
	return { code: BoxParser.OK, box: box, size: box.size };
}

BoxParser.Box.prototype.parse = function(stream) {
	if (this.type != "mdat") {
		this.data = stream.readUint8Array(this.size-this.hdr_size);
	} else {
		if (this.size === 0) {
			stream.seek(stream.getEndPosition());
		} else {
			stream.seek(this.start+this.size);
		}
	}
}

/* Used to parse a box without consuming its data, to allow detailled parsing
   Useful for boxes for which a write method is not yet implemented */
BoxParser.Box.prototype.parseDataAndRewind = function(stream) {
	this.data = stream.readUint8Array(this.size-this.hdr_size);
	// rewinding
	stream.position -= this.size-this.hdr_size;
}

BoxParser.FullBox.prototype.parseDataAndRewind = function(stream) {
	this.parseFullHeader(stream);
	this.data = stream.readUint8Array(this.size-this.hdr_size);
	// restore the header size as if the full header had not been parsed
	this.hdr_size -= 4;
	// rewinding
	stream.position -= this.size-this.hdr_size;
}

BoxParser.FullBox.prototype.parseFullHeader = function (stream) {
	this.version = stream.readUint8();
	this.flags = stream.readUint24();
	this.hdr_size += 4;
}

BoxParser.FullBox.prototype.parse = function (stream) {
	this.parseFullHeader(stream);
	this.data = stream.readUint8Array(this.size-this.hdr_size);
}

BoxParser.ContainerBox.prototype.parse = function(stream) {
	var ret;
	var box;
	while (stream.getPosition() < this.start+this.size) {
		ret = BoxParser.parseOneBox(stream, false, this.size - (stream.getPosition() - this.start));
		if (ret.code === BoxParser.OK) {
			box = ret.box;
			/* store the box in the 'boxes' array to preserve box order (for offset) but also store box in a property for more direct access */
			this.boxes.push(box);
			if (this.subBoxNames && this.subBoxNames.indexOf(box.type) != -1) {
				this[this.subBoxNames[this.subBoxNames.indexOf(box.type)]+"s"].push(box);
			} else {
				var box_type = box.type !== "uuid" ? box.type : box.uuid;
				if (this[box_type]) {
					Log.warn("Box of type "+box_type+" already stored in field of this type");
				} else {
					this[box_type] = box;
				}
			}
		} else {
			return;
		}
	}
}

BoxParser.Box.prototype.parseLanguage = function(stream) {
	this.language = stream.readUint16();
	var chars = [];
	chars[0] = (this.language>>10)&0x1F;
	chars[1] = (this.language>>5)&0x1F;
	chars[2] = (this.language)&0x1F;
	this.languageString = String.fromCharCode(chars[0]+0x60, chars[1]+0x60, chars[2]+0x60);
}

// file:src/parsing/emsg.js
BoxParser.createFullBoxCtor("emsg", function(stream) {
	if (this.version == 1) {
		this.timescale 					= stream.readUint32();
		this.presentation_time 			= stream.readUint64();
		this.event_duration			 	= stream.readUint32();
		this.id 						= stream.readUint32();
		this.scheme_id_uri 				= stream.readCString();
		this.value 						= stream.readCString();
	} else {
		this.scheme_id_uri 				= stream.readCString();
		this.value 						= stream.readCString();
		this.timescale 					= stream.readUint32();
		this.presentation_time_delta 	= stream.readUint32();
		this.event_duration			 	= stream.readUint32();
		this.id 						= stream.readUint32();
	}
	var message_size = this.size - this.hdr_size - (4*4 + (this.scheme_id_uri.length+1) + (this.value.length+1));
	if (this.version == 1) {
		message_size -= 4;
	}
	this.message_data = stream.readUint8Array(message_size);
});

// file:src/parsing/styp.js
BoxParser.createBoxCtor("styp", function(stream) {
	BoxParser.ftypBox.prototype.parse.call(this, stream);
});

// file:src/parsing/ftyp.js
BoxParser.createBoxCtor("ftyp", function(stream) {
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
});

// file:src/parsing/mdhd.js
BoxParser.createFullBoxCtor("mdhd", function(stream) {
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
});

// file:src/parsing/mfhd.js
BoxParser.createFullBoxCtor("mfhd", function(stream) {
	this.sequence_number = stream.readUint32();
});

// file:src/parsing/mvhd.js
BoxParser.createFullBoxCtor("mvhd", function(stream) {
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
});
// file:src/parsing/sidx.js
BoxParser.createFullBoxCtor("sidx", function(stream) {
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
});

// file:src/parsing/ssix.js
BoxParser.createFullBoxCtor("ssix", function(stream) {
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
});

// file:src/parsing/tkhd.js
BoxParser.createFullBoxCtor("tkhd", function(stream) {
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
});

// file:src/parsing/tfhd.js
BoxParser.createFullBoxCtor("tfhd", function(stream) {
	var readBytes = 0;
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
});

// file:src/parsing/tfdt.js
BoxParser.createFullBoxCtor("tfdt", function(stream) {
	if (this.version == 1) {
		this.baseMediaDecodeTime = stream.readUint64();
	} else {
		this.baseMediaDecodeTime = stream.readUint32();
	}
});

// file:src/parsing/trun.js
BoxParser.createFullBoxCtor("trun", function(stream) {
	var readBytes = 0;
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
});

// file:src/isofile.js
/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var ISOFile = function (stream) {
	/* MutiBufferStream object used to parse boxes */
	this.stream = stream || new MultiBufferStream();
	/* Array of all boxes (in order) found in the file */
	this.boxes = [];
	/* Array of all mdats */
	this.mdats = [];
	/* Array of all moofs */
	this.moofs = [];
	/* Boolean indicating if the file is compatible with progressive parsing (moov first) */
	this.isProgressive = false;
	/* Boolean used to fire moov start event only once */
	this.moovStartFound = false;
	/* Callback called when the moov parsing starts */
	this.onMoovStart = null;
	/* Boolean keeping track of the call to onMoovStart, to avoid double calls */
	this.moovStartSent = false;
	/* Callback called when the moov is entirely parsed */
	this.onReady = null;
	/* Boolean keeping track of the call to onReady, to avoid double calls */
	this.readySent = false;
	/* Callback to call when segments are ready */
	this.onSegment = null;
	/* Callback to call when samples are ready */
	this.onSamples = null;
	/* Callback to call when there is an error in the parsing or processing of samples */
	this.onError = null;
	/* Boolean indicating if the moov box run-length encoded tables of sample information have been processed */
	this.sampleListBuilt = false;
	/* Array of Track objects for which fragmentation of samples is requested */
	this.fragmentedTracks = [];
	/* Array of Track objects for which extraction of samples is requested */
	this.extractedTracks = [];
	/* Boolean indicating that fragmention is ready */
	this.isFragmentationInitialized = false;
	/* Boolean indicating that fragmented has started */
	this.sampleProcessingStarted = false;
	/* Number of the next 'moof' to generate when fragmenting */
	this.nextMoofNumber = 0;
	/* Boolean indicating if the initial list of items has been produced */
	this.itemListBuilt = false;
	/* Callback called when the sidx box is entirely parsed */
	this.onSidx = null;
	/* Boolean keeping track of the call to onSidx, to avoid double calls */
	this.sidxSent = false;
}

ISOFile.prototype.setSegmentOptions = function(id, user, options) {
	var trak = this.getTrackById(id);
	if (trak) {
		var fragTrack = {};
		this.fragmentedTracks.push(fragTrack);
		fragTrack.id = id;
		fragTrack.user = user;
		fragTrack.trak = trak;
		trak.nextSample = 0;
		fragTrack.segmentStream = null;
		fragTrack.nb_samples = 1000;
		fragTrack.rapAlignement = true;
		if (options) {
			if (options.nbSamples) fragTrack.nb_samples = options.nbSamples;
			if (options.rapAlignement) fragTrack.rapAlignement = options.rapAlignement;
		}
	}
}

ISOFile.prototype.unsetSegmentOptions = function(id) {
	var index = -1;
	for (var i = 0; i < this.fragmentedTracks.length; i++) {
		var fragTrack = this.fragmentedTracks[i];
		if (fragTrack.id == id) {
			index = i;
		}
	}
	if (index > -1) {
		this.fragmentedTracks.splice(index, 1);
	}
}

ISOFile.prototype.setExtractionOptions = function(id, user, options) {
	var trak = this.getTrackById(id);
	if (trak) {
		var extractTrack = {};
		this.extractedTracks.push(extractTrack);
		extractTrack.id = id;
		extractTrack.user = user;
		extractTrack.trak = trak;
		trak.nextSample = 0;
		extractTrack.nb_samples = 1000;
		extractTrack.samples = [];
		if (options) {
			if (options.nbSamples) extractTrack.nb_samples = options.nbSamples;
		}
	}
}

ISOFile.prototype.unsetExtractionOptions = function(id) {
	var index = -1;
	for (var i = 0; i < this.extractedTracks.length; i++) {
		var extractTrack = this.extractedTracks[i];
		if (extractTrack.id == id) {
			index = i;
		}
	}
	if (index > -1) {
		this.extractedTracks.splice(index, 1);
	}
}

ISOFile.prototype.parse = function() {
	var found;
	var ret;
	var box;
	var parseBoxHeadersOnly = false;

	if (this.restoreParsePosition)	{
		if (!this.restoreParsePosition()) {
			return;
		}
	}

	while (true) {

		if (this.hasIncompleteMdat && this.hasIncompleteMdat()) {
			if (this.processIncompleteMdat()) {
				continue;
			} else {
				return;
			}
		} else {
			if (this.saveParsePosition)	{
				this.saveParsePosition();
			}
			ret = BoxParser.parseOneBox(this.stream, parseBoxHeadersOnly);
			if (ret.code === BoxParser.ERR_NOT_ENOUGH_DATA) {
				if (this.processIncompleteBox) {
					if (this.processIncompleteBox(ret)) {
						continue;
					} else {
						return;
					}
				} else {
					return;
				}
			} else {
				var box_type;
				/* the box is entirely parsed */
				box = ret.box;
				box_type = (box.type !== "uuid" ? box.type : box.uuid);
				/* store the box in the 'boxes' array to preserve box order (for file rewrite if needed)  */
				this.boxes.push(box);
				/* but also store box in a property for more direct access */
				switch (box_type) {
					case "mdat":
						this.mdats.push(box);
						break;
					case "moof":
						this.moofs.push(box);
						break;
					case "moov":
						this.moovStartFound = true;
						if (this.mdats.length === 0) {
							this.isProgressive = true;
						}
						/* no break */
						/* falls through */
					default:
						if (this[box_type] !== undefined) {
							Log.warn("ISOFile", "Duplicate Box of type: "+box_type+", overriding previous occurrence");
						}
						this[box_type] = box;
						break;
				}
				if (this.updateUsedBytes) {
					this.updateUsedBytes(box, ret);
				}
			}
		}
	}
}

ISOFile.prototype.checkBuffer = function (ab) {
	if (ab === null || ab === undefined) {
		throw("Buffer must be defined and non empty");
	}
	if (ab.fileStart === undefined) {
		throw("Buffer must have a fileStart property");
	}
	if (ab.byteLength === 0) {
		Log.warn("ISOFile", "Ignoring empty buffer (fileStart: "+ab.fileStart+")");
		this.stream.logBufferLevel();
		return false;
	}
	Log.info("ISOFile", "Processing buffer (fileStart: "+ab.fileStart+")");

	/* mark the bytes in the buffer as not being used yet */
	ab.usedBytes = 0;
	this.stream.insertBuffer(ab);
	this.stream.logBufferLevel();

	if (!this.stream.initialized()) {
		Log.warn("ISOFile", "Not ready to start parsing");
		return false;
	}
	return true;
}

/* Processes a new ArrayBuffer (with a fileStart property)
   Returns the next expected file position, or undefined if not ready to parse */
ISOFile.prototype.appendBuffer = function(ab, last) {
	var nextFileStart;
	if (!this.checkBuffer(ab)) {
		return;
	}

	/* Parse whatever is in the existing buffers */
	this.parse();

	/* Check if the moovStart callback needs to be called */
	if (this.moovStartFound && !this.moovStartSent) {
		this.moovStartSent = true;
		if (this.onMoovStart) this.onMoovStart();
	}

	if (this.moov) {
		/* A moov box has been entirely parsed */

		/* if this is the first call after the moov is found we initialize the list of samples (may be empty in fragmented files) */
		if (!this.sampleListBuilt) {
			this.buildSampleLists();
			this.sampleListBuilt = true;
		}

		/* We update the sample information if there are any new moof boxes */
		this.updateSampleLists();

		/* If the application needs to be informed that the 'moov' has been found,
		   we create the information object and callback the application */
		if (this.onReady && !this.readySent) {
			this.readySent = true;
			this.onReady(this.getInfo());
		}

		/* See if any sample extraction or segment creation needs to be done with the available samples */
		this.processSamples(last);

		/* Inform about the best range to fetch next */
		if (this.nextSeekPosition) {
			nextFileStart = this.nextSeekPosition;
			this.nextSeekPosition = undefined;
		} else {
			nextFileStart = this.nextParsePosition;
		}
		if (this.stream.getEndFilePositionAfter) {
			nextFileStart = this.stream.getEndFilePositionAfter(nextFileStart);
		}
	} else {
		if (this.nextParsePosition) {
			/* moov has not been parsed but the first buffer was received,
			   the next fetch should probably be the next box start */
			nextFileStart = this.nextParsePosition;
		} else {
			/* No valid buffer has been parsed yet, we cannot know what to parse next */
			nextFileStart = 0;
		}
	}
	if (this.sidx) {
		if (this.onSidx && !this.sidxSent) {
			this.onSidx(this.sidx);
			this.sidxSent = true;
		}
	}
	if (this.meta) {
		if (this.flattenItemInfo && !this.itemListBuilt) {
			this.flattenItemInfo();
			this.itemListBuilt = true;
		}
		if (this.processItems) {
			this.processItems(this.onItem);
		}
	}

	if (this.stream.cleanBuffers) {
		Log.info("ISOFile", "Done processing buffer (fileStart: "+ab.fileStart+") - next buffer to fetch should have a fileStart position of "+nextFileStart);
		this.stream.logBufferLevel();
		this.stream.cleanBuffers();
		this.stream.logBufferLevel(true);
		Log.info("ISOFile", "Sample data size in memory: "+this.getAllocatedSampleDataSize());
	}
	return nextFileStart;
}

ISOFile.prototype.getInfo = function() {
	var i, j;
	var movie = {};
	var trak;
	var track;
	var ref;
	var sample_desc;
	var _1904 = (new Date('1904-01-01T00:00:00Z').getTime());

	if (this.moov) {
		movie.hasMoov = true;
		movie.duration = this.moov.mvhd.duration;
		movie.timescale = this.moov.mvhd.timescale;
		movie.isFragmented = (this.moov.mvex != null);
		if (movie.isFragmented && this.moov.mvex.mehd) {
			movie.fragment_duration = this.moov.mvex.mehd.fragment_duration;
		}
		movie.isProgressive = this.isProgressive;
		movie.hasIOD = (this.moov.iods != null);
		movie.brands = [];
		movie.brands.push(this.ftyp.major_brand);
		movie.brands = movie.brands.concat(this.ftyp.compatible_brands);
		movie.created = new Date(_1904+this.moov.mvhd.creation_time*1000);
		movie.modified = new Date(_1904+this.moov.mvhd.modification_time*1000);
		movie.tracks = [];
		movie.audioTracks = [];
		movie.videoTracks = [];
		movie.subtitleTracks = [];
		movie.metadataTracks = [];
		movie.hintTracks = [];
		movie.otherTracks = [];
		for (i = 0; i < this.moov.traks.length; i++) {
			trak = this.moov.traks[i];
			sample_desc = trak.mdia.minf.stbl.stsd.entries[0];
			track = {};
			movie.tracks.push(track);
			track.id = trak.tkhd.track_id;
			track.name = trak.mdia.hdlr.name;
			track.references = [];
			if (trak.tref) {
				for (j = 0; j < trak.tref.boxes.length; j++) {
					ref = {};
					track.references.push(ref);
					ref.type = trak.tref.boxes[j].type;
					ref.track_ids = trak.tref.boxes[j].track_ids;
				}
			}
			if (trak.edts) {
				track.edits = trak.edts.elst.entries;
			}
			track.created = new Date(_1904+trak.tkhd.creation_time*1000);
			track.modified = new Date(_1904+trak.tkhd.modification_time*1000);
			track.movie_duration = trak.tkhd.duration;
			track.movie_timescale = movie.timescale;
			track.layer = trak.tkhd.layer;
			track.alternate_group = trak.tkhd.alternate_group;
			track.volume = trak.tkhd.volume;
			track.matrix = trak.tkhd.matrix;
			track.track_width = trak.tkhd.width/(1<<16);
			track.track_height = trak.tkhd.height/(1<<16);
			track.timescale = trak.mdia.mdhd.timescale;
			track.cts_shift = trak.mdia.minf.stbl.cslg;
			track.duration = trak.mdia.mdhd.duration;
			track.samples_duration = trak.samples_duration;
			track.codec = sample_desc.getCodec();
			track.kind = (trak.udta && trak.udta.kinds.length ? trak.udta.kinds[0] : { schemeURI: "", value: ""});
			track.language = (trak.mdia.elng ? trak.mdia.elng.extended_language : trak.mdia.mdhd.languageString);
			track.nb_samples = trak.samples.length;
			track.size = trak.samples_size;
			track.bitrate = (track.size*8*track.timescale)/track.samples_duration;
			if (sample_desc.isAudio()) {
				track.type = "audio";
				movie.audioTracks.push(track);
				track.audio = {};
				track.audio.sample_rate = sample_desc.getSampleRate();
				track.audio.channel_count = sample_desc.getChannelCount();
				track.audio.sample_size = sample_desc.getSampleSize();
			} else if (sample_desc.isVideo()) {
				track.type = "video";
				movie.videoTracks.push(track);
				track.video = {};
				track.video.width = sample_desc.getWidth();
				track.video.height = sample_desc.getHeight();
			} else if (sample_desc.isSubtitle()) {
				track.type = "subtitles";
				movie.subtitleTracks.push(track);
			} else if (sample_desc.isHint()) {
				track.type = "metadata";
				movie.hintTracks.push(track);
			} else if (sample_desc.isMetadata()) {
				track.type = "metadata";
				movie.metadataTracks.push(track);
			} else {
				track.type = "metadata";
				movie.otherTracks.push(track);
			}
		}
	} else {
		movie.hasMoov = false;
	}
	movie.mime = "";
	if (movie.hasMoov && movie.tracks) {
		if (movie.videoTracks && movie.videoTracks.length > 0) {
			movie.mime += 'video/mp4; codecs=\"';
		} else if (movie.audioTracks && movie.audioTracks.length > 0) {
			movie.mime += 'audio/mp4; codecs=\"';
		} else {
			movie.mime += 'application/mp4; codecs=\"';
		}
		for (i = 0; i < movie.tracks.length; i++) {
			if (i !== 0) movie.mime += ',';
			movie.mime+= movie.tracks[i].codec;
		}
		movie.mime += '\"; profiles=\"';
		movie.mime += this.ftyp.compatible_brands.join();
		movie.mime += '\"';
	}
	return movie;
}

ISOFile.prototype.setNextSeekPositionFromSample = function (sample) {
	if (!sample) {
		return;
	}
	if (this.nextSeekPosition) {
		this.nextSeekPosition = Math.min(sample.offset+sample.alreadyRead,this.nextSeekPosition);
	} else {
		this.nextSeekPosition = sample.offset+sample.alreadyRead;
	}
}

ISOFile.prototype.processSamples = function(last) {
	var i;
	var trak;
	if (!this.sampleProcessingStarted) return;

	/* For each track marked for fragmentation,
	   check if the next sample is there (i.e. if the sample information is known (i.e. moof has arrived) and if it has been downloaded)
	   and create a fragment with it */
	if (this.isFragmentationInitialized && this.onSegment !== null) {
		for (i = 0; i < this.fragmentedTracks.length; i++) {
			var fragTrak = this.fragmentedTracks[i];
			trak = fragTrak.trak;
			while (trak.nextSample < trak.samples.length && this.sampleProcessingStarted) {
				/* The sample information is there (either because the file is not fragmented and this is not the last sample,
				or because the file is fragmented and the moof for that sample has been received */
				Log.debug("ISOFile", "Creating media fragment on track #"+fragTrak.id +" for sample "+trak.nextSample);
				var result = this.createFragment(fragTrak.id, trak.nextSample, fragTrak.segmentStream);
				if (result) {
					fragTrak.segmentStream = result;
					trak.nextSample++;
				} else {
					/* The fragment could not be created because the media data is not there (not downloaded), wait for it */
					break;
				}
				/* A fragment is created by sample, but the segment is the accumulation in the buffer of these fragments.
				   It is flushed only as requested by the application (nb_samples) to avoid too many callbacks */
				if (trak.nextSample % fragTrak.nb_samples === 0 || (last || trak.nextSample >= trak.samples.length)) {
					Log.info("ISOFile", "Sending fragmented data on track #"+fragTrak.id+" for samples ["+Math.max(0,trak.nextSample-fragTrak.nb_samples)+","+(trak.nextSample-1)+"]");
					Log.info("ISOFile", "Sample data size in memory: "+this.getAllocatedSampleDataSize());
					if (this.onSegment) {
						this.onSegment(fragTrak.id, fragTrak.user, fragTrak.segmentStream.buffer, trak.nextSample, (last || trak.nextSample >= trak.samples.length));
					}
					/* force the creation of a new buffer */
					fragTrak.segmentStream = null;
					if (fragTrak !== this.fragmentedTracks[i]) {
						/* make sure we can stop fragmentation if needed */
						break;
					}
				}
			}
		}
	}

	if (this.onSamples !== null) {
		/* For each track marked for data export,
		   check if the next sample is there (i.e. has been downloaded) and send it */
		for (i = 0; i < this.extractedTracks.length; i++) {
			var extractTrak = this.extractedTracks[i];
			trak = extractTrak.trak;
			while (trak.nextSample < trak.samples.length && this.sampleProcessingStarted) {
				Log.debug("ISOFile", "Exporting on track #"+extractTrak.id +" sample #"+trak.nextSample);
				var sample = this.getSample(trak, trak.nextSample);
				if (sample) {
					trak.nextSample++;
					extractTrak.samples.push(sample);
				} else {
					this.setNextSeekPositionFromSample(trak.samples[trak.nextSample]);
					break;
				}
				if (trak.nextSample % extractTrak.nb_samples === 0 || trak.nextSample >= trak.samples.length) {
					Log.debug("ISOFile", "Sending samples on track #"+extractTrak.id+" for sample "+trak.nextSample);
					if (this.onSamples) {
						this.onSamples(extractTrak.id, extractTrak.user, extractTrak.samples);
					}
					extractTrak.samples = [];
					if (extractTrak !== this.extractedTracks[i]) {
						/* check if the extraction needs to be stopped */
						break;
					}
				}
			}
		}
	}
}

/* Find and return specific boxes using recursion and early return */
ISOFile.prototype.getBox = function(type) {
  var result = this.getBoxes(type, true);
  return (result.length ? result[0] : null);
}

ISOFile.prototype.getBoxes = function(type, returnEarly) {
  var result = [];
  ISOFile._sweep.call(this, type, result, returnEarly);
  return result;
}

ISOFile._sweep = function(type, result, returnEarly) {
  if (this.type && this.type == type) result.push(this);
  for (var box in this.boxes) {
    if (result.length && returnEarly) return;
    ISOFile._sweep.call(this.boxes[box], type, result, returnEarly);
  }
}

ISOFile.prototype.getTrackSamplesInfo = function(track_id) {
	var track = this.getTrackById(track_id);
	if (track) {
		return track.samples;
	} else {
		return;
	}
}

ISOFile.prototype.getTrackSample = function(track_id, number) {
	var track = this.getTrackById(track_id);
	var sample = this.getSample(track, number);
	return sample;
}

/* Called by the application to release the resources associated to samples already forwarded to the application */
ISOFile.prototype.releaseUsedSamples = function (id, sampleNum) {
	var size = 0;
	var trak = this.getTrackById(id);
	if (!trak.lastValidSample) trak.lastValidSample = 0;
	for (var i = trak.lastValidSample; i < sampleNum; i++) {
		size+=this.releaseSample(trak, i);
	}
	Log.info("ISOFile", "Track #"+id+" released samples up to "+sampleNum+" (released size: "+size+", remaining: "+this.samplesDataSize+")");
	trak.lastValidSample = sampleNum;
}

ISOFile.prototype.start = function() {
	this.sampleProcessingStarted = true;
	this.processSamples(false);
}

ISOFile.prototype.stop = function() {
	this.sampleProcessingStarted = false;
}

/* Called by the application to flush the remaining samples (e.g. once the download is finished or when no more samples will be added) */
ISOFile.prototype.flush = function() {
	Log.info("ISOFile", "Flushing remaining samples");
	this.updateSampleLists();
	this.processSamples(true);
	this.stream.cleanBuffers();
	this.stream.logBufferLevel(true);
}

/* Finds the byte offset for a given time on a given track
   also returns the time of the previous rap */
ISOFile.prototype.seekTrack = function(time, useRap, trak) {
	var j;
	var sample;
	var seek_offset = Infinity;
	var rap_seek_sample_num = 0;
	var seek_sample_num = 0;
	var timescale;

	if (trak.samples.length === 0) {
		Log.info("ISOFile", "No sample in track, cannot seek! Using time "+Log.getDurationString(0, 1) +" and offset: "+0);
		return { offset: 0, time: 0 };
	}

	for (j = 0; j < trak.samples.length; j++) {
		sample = trak.samples[j];
		if (j === 0) {
			seek_sample_num = 0;
			timescale = sample.timescale;
		} else if (sample.cts > time * sample.timescale) {
			seek_sample_num = j-1;
			break;
		}
		if (useRap && sample.is_sync) {
			rap_seek_sample_num = j;
		}
	}
	if (useRap) {
		seek_sample_num = rap_seek_sample_num;
	}
	time = trak.samples[seek_sample_num].cts;
	trak.nextSample = seek_sample_num;
	while (trak.samples[seek_sample_num].alreadyRead === trak.samples[seek_sample_num].size) {
		// No remaining samples to look for, all are downloaded.
		if (!trak.samples[seek_sample_num + 1]) {
			break;
		}
		seek_sample_num++;
	}
	seek_offset = trak.samples[seek_sample_num].offset+trak.samples[seek_sample_num].alreadyRead;
	Log.info("ISOFile", "Seeking to "+(useRap ? "RAP": "")+" sample #"+trak.nextSample+" on track "+trak.tkhd.track_id+", time "+Log.getDurationString(time, timescale) +" and offset: "+seek_offset);
	return { offset: seek_offset, time: time/timescale };
}

ISOFile.prototype.getTrackDuration = function (trak) {
	var sample;

	if (!trak.samples) {
		return Infinity;
	}
	sample = trak.samples[trak.samples.length - 1];
	return (sample.cts + sample.duration) / sample.timescale;
}

/* Finds the byte offset in the file corresponding to the given time or to the time of the previous RAP */
ISOFile.prototype.seek = function(time, useRap) {
	var moov = this.moov;
	var trak;
	var trak_seek_info;
	var i;
	var seek_info = { offset: Infinity, time: Infinity };
	if (!this.moov) {
		throw "Cannot seek: moov not received!";
	} else {
		for (i = 0; i<moov.traks.length; i++) {
			trak = moov.traks[i];
			if (time > this.getTrackDuration(trak)) { // skip tracks that already ended
				continue;
			}
			trak_seek_info = this.seekTrack(time, useRap, trak);
			if (trak_seek_info.offset < seek_info.offset) {
				seek_info.offset = trak_seek_info.offset;
			}
			if (trak_seek_info.time < seek_info.time) {
				seek_info.time = trak_seek_info.time;
			}
		}
		Log.info("ISOFile", "Seeking at time "+Log.getDurationString(seek_info.time, 1)+" needs a buffer with a fileStart position of "+seek_info.offset);
		if (seek_info.offset === Infinity) {
			/* No sample info, in all tracks, cannot seek */
			seek_info = { offset: this.nextParsePosition, time: 0 };
		} else {
			/* check if the seek position is already in some buffer and
			 in that case return the end of that buffer (or of the last contiguous buffer) */
			/* TODO: Should wait until append operations are done */
			seek_info.offset = this.stream.getEndFilePositionAfter(seek_info.offset);
		}
		Log.info("ISOFile", "Adjusted seek position (after checking data already in buffer): "+seek_info.offset);
		return seek_info;
	}
}

ISOFile.prototype.equal = function(b) {
	var box_index = 0;
	while (box_index < this.boxes.length && box_index < b.boxes.length) {
		var a_box = this.boxes[box_index];
		var b_box = b.boxes[box_index];
		if (!BoxParser.boxEqual(a_box, b_box)) {
			return false;
		}
		box_index++;
	}
	return true;
}

if (typeof exports !== 'undefined') {
	exports.ISOFile = ISOFile;
}
// file:src/box-print.js
/* 
 * Copyright (c) Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
BoxParser.Box.prototype.printHeader = function(output) {
	this.size += 8;
	if (this.size > MAX_SIZE) {
		this.size += 8;
	}
	if (this.type === "uuid") {
		this.size += 16;
	}
	output.log(output.indent+"size:"+this.size);
	output.log(output.indent+"type:"+this.type);
}

BoxParser.FullBox.prototype.printHeader = function(output) {
	this.size += 4;
	BoxParser.Box.prototype.printHeader.call(this, output);
	output.log(output.indent+"version:"+this.version);
	output.log(output.indent+"flags:"+this.flags);
}

BoxParser.Box.prototype.print = function(output) {
	this.printHeader(output);
}

BoxParser.ContainerBox.prototype.print = function(output) {
	this.printHeader(output);
	for (var i=0; i<this.boxes.length; i++) {
		if (this.boxes[i]) {
			var prev_indent = output.indent;
			output.indent += " ";
			this.boxes[i].print(output);
			output.indent = prev_indent;
		}
	}
}

ISOFile.prototype.print = function(output) {
	output.indent = "";
	for (var i=0; i<this.boxes.length; i++) {
		if (this.boxes[i]) {
			this.boxes[i].print(output);
		}
	}	
}

BoxParser.mvhdBox.prototype.print = function(output) {
	BoxParser.FullBox.prototype.printHeader.call(this, output);
	output.log(output.indent+"creation_time: "+this.creation_time);
	output.log(output.indent+"modification_time: "+this.modification_time);
	output.log(output.indent+"timescale: "+this.timescale);
	output.log(output.indent+"duration: "+this.duration);
	output.log(output.indent+"rate: "+this.rate);
	output.log(output.indent+"volume: "+(this.volume>>8));
	output.log(output.indent+"matrix: "+this.matrix.join(", "));
	output.log(output.indent+"next_track_id: "+this.next_track_id);
}

BoxParser.tkhdBox.prototype.print = function(output) {
	BoxParser.FullBox.prototype.printHeader.call(this, output);
	output.log(output.indent+"creation_time: "+this.creation_time);
	output.log(output.indent+"modification_time: "+this.modification_time);
	output.log(output.indent+"track_id: "+this.track_id);
	output.log(output.indent+"duration: "+this.duration);
	output.log(output.indent+"volume: "+(this.volume>>8));
	output.log(output.indent+"matrix: "+this.matrix.join(", "));
	output.log(output.indent+"layer: "+this.layer);
	output.log(output.indent+"alternate_group: "+this.alternate_group);
	output.log(output.indent+"width: "+this.width);
	output.log(output.indent+"height: "+this.height);
}// file:src/mp4box.js
/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var MP4Box = {};

MP4Box.createFile = function (_keepMdatData, _stream) {
	/* Boolean indicating if bytes containing media data should be kept in memory */
	var keepMdatData = (_keepMdatData !== undefined ? _keepMdatData : true);
	var file = new ISOFile(_stream);
	file.discardMdatData = (keepMdatData ? false : true);
	return file;
}

if (typeof exports !== 'undefined') {
	exports.createFile = MP4Box.createFile;
}

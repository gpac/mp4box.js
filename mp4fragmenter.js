var mp4boxParser = {
	boxes : [ "mdat" ],
	fullBoxes : [ "mvhd", "tkhd", "mdhd" ],
	containerBoxes : [ 
		[ "moov", [ "trak" ] ],
		[ "trak" ],
		[ "mdia" ],
	],
	initialize: function() {
		var i;
		var length;
		mp4boxParser.basicContainerBox.prototype = new mp4boxParser.Box();
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

	},
	ISOFile: function() {
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
}

mp4boxParser.basicContainerBox.prototype.parse = function(stream) {
	var box;
	var start;
	start = stream.position;
	while (stream.position < start+this.size) {
		box = mp4boxParser.parseOneBox(stream);
		if (this.subBoxNames && this.subBoxNames.indexOf(box.type) != -1) {
			this[box.type+"s"].push(box);
		} else {
			this[box.type] = box;
		}
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
	stream.readUint32();
	stream.readUint16();
	stream.readUint16();
	stream.readUint32Array(2);
	stream.readUint32Array(9);
	stream.readUint32Array(6);
	stream.readUint32();
}

mp4boxParser.tkhdBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.version == 1) {
		stream.readUint64();
		stream.readUint64();
		this.id = stream.readUint32();
		stream.readUint32();
		stream.readUint64();
	} else {
		stream.readUint32();
		stream.readUint32();
		this.id = stream.readUint32();
		stream.readUint32();
		stream.readUint32();
	}
	stream.readUint32Array(2);
	stream.readUint16();
	stream.readUint16();
	stream.readUint16();
	stream.readUint16();
	stream.readUint32Array(9);
	stream.readUint32();
	stream.readUint32();
}

mp4boxParser.mdhdBox.prototype.parse = function(stream) {
	this.parseFullHeader(stream);
	if (this.version == 1) {
		stream.readUint64();
		stream.readUint64();
		this.timescale = stream.readUint32();
		stream.readUint64();
	} else {
		stream.readUint32();
		stream.readUint32();
		this.timescale = stream.readUint32();
		stream.readUint32();
	}
	stream.readUint16(); // language
	stream.readUint16();
}

mp4boxParser.ISOFile.prototype.parse = function(stream) {
	var box;
	while (!stream.isEof()) {
		box = mp4boxParser.parseOneBox(stream);
		switch (box.type) {
			case "mdat":
				this.mdats.push(box);
				break;
			default:
				this[box.type] = box;
				break;
		}
	}
}

/* TODO: fix endianness */
DataStream.prototype.readUint64 = function () {
	return (stream.readUint32()<<32)+stream.readUint32();
}

DataStream.prototype.readUint24 = function () {
	return (this.readUint8()<<16)+(this.readUint8()<<8)+this.readUint8();
}

function MP4Fragmenter() {
	this.inputStream = null;
	this.inputIsoFile = new mp4boxParser.ISOFile();
	this.outputStream = new DataStream();
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
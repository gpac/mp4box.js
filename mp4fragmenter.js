var mp4parser = {
	ISOFile: function() {
		this.mdats = new Array();
	},
	Box: function(_type, _size) {
		this.type = _type;
		this.size = _size;
	},
	FullBox: function(type, size) {
		mp4parser.Box.call(this, type, size);
		this.flags = 0;
		this.version = 0;
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
		if (mp4parser[type+"Box"]) {
			box = new mp4parser[type+"Box"](size - hdr_size);		
		} else {
			box = new mp4parser.Box(type, size - hdr_size);
		}
		box.parse(stream);
		return box;
	},
	mvhdBox: function(size) {
		mp4parser.FullBox.call(this, "mvhd", size);
		this.timescale = 0;
		this.duration = 0;
	},
	tkhdBox: function(size) {
		mp4parser.FullBox.call(this, "tkhd", size);
		this.id = 0;
		this.duration = 0;
	},
	mdhdBox: function(size) {
		mp4parser.FullBox.call(this, "mdhd", size);
		this.timescale = 0;
		this.duration = 0;
	},
	basicContainerBox: function(type, size) {
		mp4parser.Box.call(this, type, size);
	},
	moovBox: function(size) {
		mp4parser.basicContainerBox.call(this, "moov", size);
		this.tracks = new Array();
	},
	trakBox: function(size) {
		mp4parser.basicContainerBox.call(this, "trak", size);
	},
	mdiaBox: function(size) {
		mp4parser.basicContainerBox.call(this, "mdia", size);
	},
	mdatBox: function(size) {
		mp4parser.Box.call(this, "mdat", size);
		this.data = null;
	}
}

mp4parser.mvhdBox.prototype = new mp4parser.FullBox();
mp4parser.mvhdBox.prototype.parse = function(stream) {
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

mp4parser.tkhdBox.prototype = new mp4parser.FullBox();
mp4parser.tkhdBox.prototype.parse = function(stream) {
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

mp4parser.mdhdBox.prototype = new mp4parser.FullBox();
mp4parser.mdhdBox.prototype.parse = function(stream) {
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

mp4parser.basicContainerBox.prototype = new mp4parser.Box();
mp4parser.basicContainerBox.prototype.parse = function(stream) {
	var box;
	var start;
	start = stream.position;
	while (stream.position < start+this.size) {
		box = mp4parser.parseOneBox(stream);
		switch (box.type) {
		case "trak":
			this.tracks.push(box);
			break;
		default:
			this[box.type] = box;
		}
	}
}

mp4parser.moovBox.prototype = new mp4parser.basicContainerBox();
mp4parser.trakBox.prototype = new mp4parser.basicContainerBox();
mp4parser.mdiaBox.prototype = new mp4parser.basicContainerBox();
mp4parser.mdatBox.prototype = new mp4parser.Box();
mp4parser.mdatBox.prototype.parse = function(stream) {
	this.data = stream.readUint8Array(this.size);
}
mp4parser.Box.prototype.parse = function(stream) {
	this.data = stream.readUint8Array(this.size);
}

mp4parser.FullBox.prototype.parseFullHeader = function (stream) {
	this.version = stream.readUint8();
	this.flags = stream.readUint24();
}

mp4parser.ISOFile.prototype.parse = function(stream) {
	var box;
	while (!stream.isEof()) {
		box = mp4parser.parseOneBox(stream);
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
	this.inputIsoFile = new mp4parser.ISOFile();
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
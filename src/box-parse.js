var Log = require("./log.js").Log;
var BoxParser = require("./box.js").BoxParser;

/* 
 * Copyright (c) Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
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
	Log.debug("BoxParser", "Found box of type "+type+" and size "+size+" at position "+start);
	hdr_size = 8;
	if (type == "uuid") {
		if ((stream.getEndPosition() - stream.getPosition() < 16*8) || (parentSize -hdr_size < 16*8)) {
			stream.seek(start);
			Log.debug("BoxParser", "Not enough bytes left in the parent box to parse a UUID box");
			return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
		}
		uuid = stream.readUint8Array(16);
		hdr_size += 16;
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
			if (type !== "mdat") {
				throw "Unlimited box size not supported";
			}	
		}
	}
	if (size < hdr_size) {
		Log.error("BoxParser", "Box of type "+type+" has an invalid size "+size+" (too small to be a box)");
		return { code: BoxParser.ERR_NOT_ENOUGH_DATA, type: type, size: size, hdr_size: hdr_size, start: start };		
	}
	if (parentSize && size > parentSize) {
		Log.error("BoxParser", "Box of type "+type+" has a size "+size+" greater than its container size "+parentSize);
		return { code: BoxParser.ERR_NOT_ENOUGH_DATA, type: type, size: size, hdr_size: hdr_size, start: start };
	}
	if (start + size > stream.getEndPosition()) {
		stream.seek(start);
		Log.warn("BoxParser", "Not enough data in stream to parse the entire \""+type+"\" box");
		return { code: BoxParser.ERR_NOT_ENOUGH_DATA, type: type, size: size, hdr_size: hdr_size, start: start };
	}
	if (headerOnly) {
		return { code: BoxParser.OK, type: type, size: size, hdr_size: hdr_size, start: start };
	} else {
		if (BoxParser[type+"Box"]) {
			box = new BoxParser[type+"Box"](size);
		} else {
			if (type !== "uuid") {
				Log.warn("BoxParser", "Unknown box type: "+type);
			}
			box = new BoxParser.Box(type, size);
			if (uuid) {
				box.uuid = uuid;
			}
		}
	}
	box.hdr_size = hdr_size;
	/* recording the position of the box in the input stream */
	box.start = start;
	if (box.write === BoxParser.Box.prototype.write && box.type !== "mdat") {
		Log.warn("BoxParser", box.type+" box writing not yet implemented, keeping unparsed data in memory for later write");
		box.parseDataAndRewind(stream);
	}
	box.parse(stream);
	diff = stream.getPosition() - (box.start+box.size);
	if (diff < 0) {
		Log.warn("BoxParser", "Parsing of box "+box.type+" did not read the entire indicated box data size (missing "+(-diff)+" bytes), seeking forward");
		stream.seek(box.start+box.size);
	} else if (diff > 0) {
		Log.error("BoxParser", "Parsing of box "+box.type+" read "+diff+" more bytes than the indicated box data size, seeking backwards");
		stream.seek(box.start+box.size);
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
				this[box.type] = box;
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


/* 
 * Copyright (c) Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
BoxParser.parseOneBox = function(stream, headerOnly) {
	var box;
	var start = stream.getPosition();
	var hdr_size = 0;
	var uuid;
	if (stream.getEndPosition() - start < 8) {
		Log.debug("BoxParser", "Not enough data in stream to parse the type and size of the box");
		return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
	}
	var size = stream.readUint32();
	var type = stream.readString(4);
	Log.debug("BoxParser", "Found box of type "+type+" and size "+size+" at position "+start);
	hdr_size = 8;
	if (type == "uuid") {
		uuid = stream.readUint8Array(16);
		hdr_size += 16;
	}
	if (size == 1) {
		if (stream.getEndPosition() - stream.getPosition() < 8) {
			stream.seek(start);
			Log.warn("BoxParser", "Not enough data in stream to parse the extended size of the \""+type+"\" box");
			return { code: BoxParser.ERR_NOT_ENOUGH_DATA };
		}
		size = stream.readUint64();
		hdr_size += 8;
	} else if (size === 0) {
		/* box extends till the end of file */
		if (type !== "mdat") {
			throw "Unlimited box size not supported";
		}
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
	return { code: BoxParser.OK, box: box, size: size };
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
		ret = BoxParser.parseOneBox(stream, false);
		box = ret.box;
		/* store the box in the 'boxes' array to preserve box order (for offset) but also store box in a property for more direct access */
		this.boxes.push(box);
		if (this.subBoxNames && this.subBoxNames.indexOf(box.type) != -1) {
			this[this.subBoxNames[this.subBoxNames.indexOf(box.type)]+"s"].push(box);
		} else {
			this[box.type] = box;
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


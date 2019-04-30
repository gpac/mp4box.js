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
		[ "ipco"]
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

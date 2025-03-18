/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var BoxParser = {
	ERR_INVALID_DATA : -1,
	ERR_NOT_ENOUGH_DATA : 0,
	OK : 1,

	// Boxes to be created with default parsing
	BASIC_BOXES: [
		{type: "mdat", name: "MediaDataBox"},
		{type: "idat", name: "ItemDataBox"},
		{type: "free", name: "FreeSpaceBox"},
		{type: "skip", name: "FreeSpaceBox"},
		{type: "meco", name: "AdditionalMetadataContainerBox"},
		{type: "strk", name: "SubTrackBox"}
	],
	FULL_BOXES: [
		{type: "hmhd", name: "HintMediaHeaderBox"},
		{type: "nmhd", name: "NullMediaHeaderBox"},
		{type: "iods", name: "ObjectDescriptorBox"},
		{type: "xml ", name: "XMLBox"},
		{type: "bxml", name: "BinaryXMLBox"},
		{type: "ipro", name: "ItemProtectionBox"},
		{type: "mere", name: "MetaboxRelationBox"}
	],
	CONTAINER_BOXES: [
		[{type: "moov", name: "CompressedMovieBox"}, ["trak", "pssh"]],
		[{type: "trak", name: "TrackBox"}],
		[{type: "edts", name: "EditBox"}],
		[{type: "mdia", name: "MediaBox"}],
		[{type: "minf", name: "MediaInformationBox"}],
		[{type: "dinf", name: "DataInformationBox"}],
		[{type: "stbl", name: "SampleTableBox"}, ["sgpd", "sbgp"]],
		[{type: "mvex", name: "MovieExtendsBox"}, ["trex"]],
		[{type: "moof", name: "CompressedMovieFragmentBox"}, ["traf"]],
		[{type: "traf", name: "TrackFragmentBox"}, ["trun", "sgpd", "sbgp"]],
		[{type: "vttc", name: "VTTCueBox"}],
		[{type: "tref", name: "TrackReferenceBox"}],
		[{type: "iref", name: "ItemReferenceBox"}],
		[{type: "mfra", name: "MovieFragmentRandomAccessBox"}, ["tfra"]],
		[{type: "meco", name: "AdditionalMetadataContainerBox"}],
		[{type: "hnti", name: "trackhintinformation"}],
		[{type: "hinf", name: "hintstatisticsbox"}],
		[{type: "strk", name: "SubTrackBox"}],
		[{type: "strd", name: "SubTrackDefinitionBox"}],
		[{type: "sinf", name: "ProtectionSchemeInfoBox"}],
		[{type: "rinf", name: "RestrictedSchemeInfoBox"}],
		[{type: "schi", name: "SchemeInformationBox"}],
		[{type: "trgr", name: "TrackGroupBox"}],
		[{type: "udta", name: "UserDataBox"}, ["kind"]],
		[{type: "iprp", name: "ItemPropertiesBox"}, ["ipma"]],
		[{type: "ipco", name: "ItemPropertyContainerBox"}],
		[{type: "grpl", name: "GroupsListBox"}],
		[{type: "j2kH", name: "J2KHeaderInfoBox"}],
		[{type: "etyp", name: "ExtendedTypeBox"}, ["tyco"]]
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
		BoxParser.BASIC_BOXES.forEach(function(box) {
			BoxParser.createBoxCtor(box.type, box.name)
		});
		BoxParser.FULL_BOXES.forEach(function(box) {
			BoxParser.createFullBoxCtor(box.type, box.name);
		});
		BoxParser.CONTAINER_BOXES.forEach(function(boxes) {
			BoxParser.createContainerBoxCtor(boxes[0].type, boxes[0].name, null, boxes[1]);
		});
	},
	Box: function(_type, _size, _name, _uuid) {
		this.type = _type;
		this.box_name = _name;
		this.size = _size;
		this.uuid = _uuid;
	},
	FullBox: function(type, size, name, uuid) {
		BoxParser.Box.call(this, type, size, name, uuid);
		this.flags = 0;
		this.version = 0;
	},
	ContainerBox: function(type, size, name, uuid) {
		BoxParser.Box.call(this, type, size, name, uuid);
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
	createBoxCtor: function(type, name, parseMethod){
		BoxParser.boxCodes.push(type);
		BoxParser[type+"Box"] = function(size) {
			BoxParser.Box.call(this, type, size, name);
		}
		BoxParser[type+"Box"].prototype = new BoxParser.Box();
		if (parseMethod) BoxParser[type+"Box"].prototype.parse = parseMethod;
	},
	createFullBoxCtor: function(type, name, parseMethod) {
		//BoxParser.fullBoxCodes.push(type);
		BoxParser[type+"Box"] = function(size) {
			BoxParser.FullBox.call(this, type, size, name);
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
	createContainerBoxCtor: function(type, name, parseMethod, subBoxNames) {
		//BoxParser.containerBoxCodes.push(type);
		BoxParser[type+"Box"] = function(size) {
			BoxParser.ContainerBox.call(this, type, size, name);
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
	createUUIDBox: function(uuid, name, isFullBox, isContainerBox, parseMethod) {
		BoxParser.UUIDs.push(uuid);
		BoxParser.UUIDBoxes[uuid] = function(size) {
			if (isFullBox) {
				BoxParser.FullBox.call(this, "uuid", size, name, uuid);
			} else {
				if (isContainerBox) {
					BoxParser.ContainerBox.call(this, "uuid", size, name, uuid);
				} else {
					BoxParser.Box.call(this, "uuid", size, name, uuid);
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

/* 
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var BoxParser = {
	ERR_NOT_ENOUGH_DATA : 0,
	OK : 1,
	boxCodes : [ 
				 "mdat", "idat", "free", "skip",
				 "avcC", "hvcC", "ftyp", "styp", 
				 "payl", "vttC",
				 "rtp ", "sdp ",
				 "btrt", "frma",
				 "trpy", "tpyl", "totl", "tpay", "dmed", "dimm", "drep", "nump", "npck", "maxr", "tmin", "tmax", "dmax", "pmax", "payt",
				 "vmhd", "smhd", "hmhd", // full boxes not yet parsed
				 "idat", "meco",
				 "udta", "strk",
				 "free", "skip"
			   ],
	fullBoxCodes : [ "mvhd", "tkhd", "mdhd", "hdlr", "vmhd", "smhd", "hmhd", "nmhd", "url ", "urn ", 
				  "ctts", "cslg", "stco", "co64", "stsc", "stss", "stsz", "stz2", "stts", "stsh", 
				  "mehd", "trex", "mfhd", "tfhd", "trun", "tfdt",
				  "esds", "subs",
				  "txtC",
				  "sidx", "emsg", "prft", "pssh",
				  "elst", "dref", "url ", "urn ",
				  "sbgp", "sgpd",
				  "cprt",
				  "iods",
				  "ssix", "tfra", "mfro", "pdin", "tsel",
				  "trep", "leva", "stri", "stsg",
				  "schm", 
				  "stvi", 
				  "padb", "stdp", "sdtp", "saio", "saiz",
				  "meta", "xml ", "bxml", "iloc", "pitm", "ipro", "iinf", "infe", "iref" , "mere", 
				  "kind", "elng",
				  /* missing "stsd", "iref", : special case full box and container */
				],
	containerBoxCodes : [ 
		[ "moov", [ "trak", "sidx" ] ],
		[ "trak" ],
		[ "edts" ],
		[ "mdia" ],
		[ "minf" ],
		[ "dinf" ],
		[ "stbl", [ "sgpd" ] ],
		[ "mvex", [ "trex" ] ],
		[ "moof", [ "traf" ] ],
		[ "traf", [ "trun" ] ],
		[ "vttc" ], 
		[ "tref" ],
		[ "iref" ],
		[ "udta" ],
		[ "mfra" ],
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
		[ "iprp" ]
	],
	sampleEntryCodes : [ 
		/* 4CC as registered on http://mp4ra.org/codecs.html */
		{ prefix: "Visual", types: [ "mp4v", "avc1", "avc2", "avc3", "avc4", "avcp", "drac", "encv", "mjp2", "mvc1", "mvc2", "resv", "s263", "svc1", "vc-1", "hvc1", "hev1"  ] },
		{ prefix: "Audio", 	types: [ "mp4a", "ac-3", "alac", "dra1", "dtsc", "dtse", ,"dtsh", "dtsl", "ec-3", "enca", "g719", "g726", "m4ae", "mlpa",  "raw ", "samr", "sawb", "sawp", "sevc", "sqcp", "ssmv", "twos", ".mp3" ] },
		{ prefix: "Hint", 	types: [ "fdp ", "m2ts", "pm2t", "prtp", "rm2t", "rrtp", "rsrp", "rtp ", "sm2t", "srtp" ] },
		{ prefix: "Metadata", types: [ "metx", "mett", "urim" ] },
		{ prefix: "Subtitle", types: [ "stpp", "wvtt", "sbtt", "tx3g", "stxt" ] },
		{ prefix: "System", types: [ "mp4s"] }
	],
	sampleGroupEntryCodes: [
		"roll", "prol", "alst", "rap ", "tele", "avss", "avll", "sync", "tscl", "tsas", "stsa", "scif", "mvif", "scnm", "dtrt", "vipr", "tele", "rash"
	],
	trackGroupTypes: [ "msrc" ],
	initialize: function() {
		var i, j;
		var length;
		BoxParser.FullBox.prototype = new BoxParser.Box();
		BoxParser.ContainerBox.prototype = new BoxParser.Box();
		BoxParser.SampleEntry.prototype = new BoxParser.FullBox();
		BoxParser.TrackGroupTypeBox.prototype = new BoxParser.FullBox();
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
				BoxParser[types[i]+"SampleEntry"] = (function (k, l) { 
					return function(size) {
						BoxParser[BoxParser.sampleEntryCodes[k].prefix+"SampleEntry"].call(this, BoxParser.sampleEntryCodes[k].types[l], size);
					}
				})(j, i);
				BoxParser[types[i]+"SampleEntry"].prototype = new BoxParser[prefix+"SampleEntry"]();
			}
		}
		/* creating constructors for stsd entries  */
		length = BoxParser.sampleGroupEntryCodes.length;
		for (i = 0; i < length; i++) {
			BoxParser[BoxParser.sampleGroupEntryCodes[i]+"SampleGroupEntry"] = (function (j) { 
				return function(size) {
					BoxParser.SampleGroupEntry.call(this, BoxParser.sampleGroupEntryCodes[j], size);
				}
			})(i);
			BoxParser[BoxParser.sampleGroupEntryCodes[i]+"SampleGroupEntry"].prototype = new BoxParser.SampleGroupEntry();
		}		
		/* creating constructors for track groups  */
		length = BoxParser.trackGroupTypes.length;
		for (i = 0; i < length; i++) {
			BoxParser[BoxParser.trackGroupTypes[i]+"Box"] = (function (j) { 
				return function(size) {
					BoxParser.TrackGroupTypeBox.call(this, BoxParser.trackGroupTypes[j], size);
				}
			})(i);
			BoxParser[BoxParser.trackGroupTypes[i]+"Box"].prototype = new BoxParser.TrackGroupTypeBox();
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
	SampleEntry: function(type, size, hdr_size, start) {
		BoxParser.Box.call(this, type, size);	
		this.hdr_size = hdr_size;
		this.start = start;
		this.boxes = [];
	},
	SampleGroupEntry: function(type) {
		this.grouping_type = type;
	},
	TrackGroupTypeBox: function(type, size) {
		BoxParser.FullBox.call(this, type, size);
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

if (typeof exports !== "undefined") {
	exports.BoxParser = BoxParser;
}

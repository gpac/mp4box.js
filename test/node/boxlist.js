var fs = require('fs');
var MP4Box = require('mp4box');

var excluded_fields = ["hdr_size", "start", "boxes", "subBoxNames", "entries", "samples", "references", "items", "item_infos", "extents"];

var str = "<ISOBMFFBoxes>\n";
function dump(list, ctor_suffix, suffix) {
	suffix = suffix || ctor_suffix;
	for (var i = 0; i < list.length; i++) {
		if (list[i] === undefined) {
			console.log(list);
		}
		var boxname = list[i]+ctor_suffix;
		var b = new MP4Box.BoxParser[boxname]();
		boxname = list[i];//(list[i]).replace(' ', '');
		str += "\t<Structure code=\""+boxname+"\" type=\""+suffix+"\">\n";
		for (var prop in b) {
			if (excluded_fields.indexOf(prop) === -1) {
				if (typeof(b[prop]) !== "function") {
					str += "\t\t<Field name=\""+prop+"\"/>\n";
				}
			}
		}
		str += "\t</Structure>\n";
	}
}
dump(MP4Box.BoxParser.boxCodes, "Box");
dump(MP4Box.BoxParser.containerBoxCodes.map(function (i) { return i[0];}), "Box");
dump([ "stsd" ], "Box", "FullBox");
dump(MP4Box.BoxParser.fullBoxCodes, "Box", "FullBox");
for (var value in MP4Box.BoxParser.sampleEntryCodes) {
	dump(MP4Box.BoxParser.sampleEntryCodes[value].types, "SampleEntry");
}
dump(MP4Box.BoxParser.sampleGroupEntryCodes, "SampleGroupEntry");
dump(MP4Box.BoxParser.trackGroupTypes, "Box", "TrackGroup");
str += "</ISOBMFFBoxes>\n";

fs.writeFileSync('boxlist.xml', str);


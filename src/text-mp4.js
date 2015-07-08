/* 
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var VTTin4Parser = function() {	
}

VTTin4Parser.prototype.parseSample = function(data) {
	var cues, cue;
	var stream = new MP4BoxStream(data.buffer);
	cues = [];
	while (!stream.isEos()) {
		cue = BoxParser.parseOneBox(stream, false);
		if (cue.code === BoxParser.OK && cue.box.type === "vttc") {
			cues.push(cue.box);
		}		
	}
	return cues;
}

var XMLSubtitlein4Parser = function() {	
}

XMLSubtitlein4Parser.prototype.parseSample = function(sample) {
	var res = {};	
	var i;
	res.resources = [];
	var stream = new MP4BoxStream(sample.data.buffer);
	if (!sample.subsamples || sample.subsamples.length === 0) {
		res.documentString = stream.readString(sample.data.length);
	} else {
		res.documentString = stream.readString(sample.subsamples[0].size);
		if (sample.subsamples.length > 1) {
			for (i = 1; i < sample.subsamples.length; i++) {
				res.resources[i] = stream.readUint8Array(sample.subsamples[i].size);
			}
		}
	}
	res.document = (new DOMParser()).parseFromString(res.documentString, "application/xml");
	return res;
}

var Textin4Parser = function() {	
}

Textin4Parser.prototype.parseSample = function(sample) {
	var textString;
	var stream = new MP4BoxStream(sample.data.buffer);
	textString = stream.readString(sample.data.length);
	return textString;
}

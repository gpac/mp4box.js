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

VTTin4Parser.prototype.getText = function (startTime, endTime, data) {
	function pad(n, width, z) {
	  z = z || '0';
	  n = n + '';
	  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
	}
	function secToTimestamp(insec) {
		var h = Math.floor(insec/3600);
		var m = Math.floor((insec - h*3600)/60);
		var s = Math.floor(insec - h*3600 - m*60);
		var ms = Math.floor((insec - h*3600 - m*60 - s)*1000);
		return ""+pad(h, 2)+":"+pad(m,2)+":"+pad(s, 2)+"."+pad(ms, 3);
	}
	var cues = this.parseSample(data);
	var string = "";
	for (var i = 0; i < cues.length; i++) {
		var cueIn4 = cues[i];
		string += secToTimestamp(startTime)+" --> "+secToTimestamp(endTime)+"\r\n";
		string += cueIn4.payl.text;
	}
	return string;
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
	if (typeof (DOMParser) !== "undefined") {
		res.document = (new DOMParser()).parseFromString(res.documentString, "application/xml");
	}
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

Textin4Parser.prototype.parseConfig = function(data) {
	var textString;
	var stream = new MP4BoxStream(data.buffer);
	stream.readUint32(); // version & flags
	textString = stream.readCString();
	return textString;
}

if (typeof exports !== 'undefined') {
	exports.VTTin4Parser = VTTin4Parser;
	exports.XMLSubtitlein4Parser = XMLSubtitlein4Parser;
	exports.Textin4Parser = Textin4Parser;
}

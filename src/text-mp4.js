/* 
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var VTTin4Parser = function() {	
}

VTTin4Parser.prototype.parseSample = function(data) {
	var cues, cue;
	var stream = new DataStream(data, 0, DataStream.BIG_ENDIAN);
	cues = [];
	while (!stream.isEof()) {
		cue = BoxParser.parseOneBox(stream);
		if (cue.code === BoxParser.OK && cue.box.type === "vttc") {
			cues.push(cue.box);
		}		
	}
	return cues;
}

var TTMLin4Parser = function() {	
}

TTMLin4Parser.prototype.parseSample = function(sample) {
	var res = {};
	res.resources = [];
	var stream = new DataStream(sample.data, 0, DataStream.BIG_ENDIAN);
	if (sample.subsamples.length==0) {
		res.document = stream.readString(sample.data.length);
	} else {
		res.document = stream.readString(sample.subsamples[0].size);
		if (sample.subsamples.length > 1) {
			for (i = 0; i < sample.subsamples.length; i++) {
				res.resources[i] = stream.readUint8Array(sample.subsamples[i].size);
			}
		}
	}
}


/*
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * This notice must stay in all subsequent versions of this code.
 */
function ISOFile() {
	this.boxes = new Array();
	this.mdats = new Array();
	this.moofs = new Array();
	this.isProgressive = false;
}

ISOFile.prototype.parse = function(stream) {
	var box;
	var err;
	while (!stream.isEof()) {
		box = BoxParser.parseOneBox(stream);
		if (box == BoxParser.ERR_NOT_ENOUGH_DATA) {
			return;
		}
		/* store the box in the 'boxes' array to preserve box order (for offset) but also store box in a property for more direct access */
		this.boxes.push(box);
		switch (box.type) {
			case "mdat":
				this.mdats.push(box);
				break;
			case "moof":
				this.moofs.push(box);
				break;
			case "moov":
				if (this.mdats.length == 0) {
					this.isProgressive = true;
				}
			default:
				this[box.type] = box;
				break;
		}
	}
}

ISOFile.prototype.write = function(stream) {
	for (var i=0; i<this.boxes.length; i++) {
		this.boxes[i].write(stream);
	}
}

ISOFile.prototype.writeInitializationSegment = function(stream) {
	//this.ftyp.write(stream);
	var mvex = new BoxParser.mvexBox();
	this.moov.boxes.push(mvex);
	var mehd = new BoxParser.mehdBox();
	mvex.boxes.push(mehd);
	mehd.fragment_duration = 0;
	for (var i = 0; i < this.moov.traks.length; i++) {
		var trex = new BoxParser.trexBox();
		mvex.boxes.push(trex);
		trex.track_ID = this.moov.traks[i].tkhd.track_id;
		trex.default_sample_description_index = 1;
		trex.default_sample_duration = this.moov.traks[i].samples[0].duration;
		trex.default_sample_size = 0;
		trex.default_sample_flags = 1<<16;
	}
	this.moov.write(stream);
}

ISOFile.prototype.resetTables = function () {
	var i;
	var trak, stco, stsc, stsz, stts, ctts, stss;
	this.moov.mvhd.duration = 0;
	for (i = 0; i < this.moov.traks.length; i++) {
		trak = this.moov.traks[i];
		trak.tkhd.duration = 0;
		trak.mdia.mdhd.duration = 0;
		stco = trak.mdia.minf.stbl.stco;
		stco.chunk_offsets = new Array();
		stsc = trak.mdia.minf.stbl.stsc;
		stsc.first_chunk = new Array();
		stsc.samples_per_chunk = new Array();
		stsc.sample_description_index = new Array();
		stsz = trak.mdia.minf.stbl.stsz;
		stsz.sample_sizes = new Array();
		stts = trak.mdia.minf.stbl.stts;
		stts.sample_counts = new Array();
		stts.sample_deltas = new Array();
		ctts = trak.mdia.minf.stbl.ctts;
		if (ctts) {
			ctts.sample_counts = new Array();
			ctts.sample_offsets = new Array();
		}
		stss = trak.mdia.minf.stbl.stss;
		var k = trak.mdia.minf.stbl.boxes.indexOf(stss);
		if (k != -1) trak.mdia.minf.stbl.boxes[k] = null;
		// if (stss) {
			// stss.sample_numbers = new Array();
		// }
	}
}

ISOFile.prototype.buildSampleLists = function() {	
	var i, j, k;
	var trak, stco, stsc, stsz, stts, ctts, stss;
	var chunk_run_index, chunk_index, last_chunk_in_run, offset_in_chunk, last_sample_in_chunk;
	var last_sample_in_stts_run, stts_run_index, last_sample_in_ctts_run, ctts_run_index, last_stss_index;
	for (i = 0; i < this.moov.traks.length; i++) {
		trak = this.moov.traks[i];
		trak.samples = new Array();
		stco = trak.mdia.minf.stbl.stco;
		stsc = trak.mdia.minf.stbl.stsc;
		stsz = trak.mdia.minf.stbl.stsz;
		stts = trak.mdia.minf.stbl.stts;
		ctts = trak.mdia.minf.stbl.ctts;
		stss = trak.mdia.minf.stbl.stss;
		chunk_index = -1;
		chunk_run_index = -1;
		last_chunk_in_run = -1;
		offset_in_chunk = 0;
		last_sample_in_chunk = 0;
		last_sample_in_stts_run = -1;
		stts_run_index = -1;
		last_sample_in_ctts_run = -1;
		ctts_run_index = -1;
		last_stss_index = 0;
		/* we build the samples one by one and compute their properties */
		for (j = 0; j < stsz.sample_sizes.length; j++) {
			var sample = {};
			sample.track_id = trak.tkhd.track_id;
			trak.samples[j] = sample;
			/* size can be known directly */
			sample.size = stsz.sample_sizes[j];
			/* computing chunk-based properties (offset, sample description index)*/
			if (j < last_sample_in_chunk) {
				/* the new sample is in the same chunk, the indexes did not change */
				sample.chunk_index = chunk_index;
				sample.chunk_run_index = chunk_run_index;
			} else {
				/* the new sample is not in this chunk */
				offset_in_chunk = 0;
				chunk_index++;
				sample.chunk_index = chunk_index;
				if (chunk_index < last_chunk_in_run) {
					/* this new chunk in the same run of chunks */					
					sample.chunk_run_index = chunk_run_index;
				} else {
					/* this chunk starts a new run */
					if (chunk_run_index < stsc.first_chunk.length - 2) {
						/* the last chunk in this new run is the beginning of the next one */
						chunk_run_index++;
						last_chunk_in_run = stsc.first_chunk[chunk_run_index+1]-1; // chunk number are 1-based
					} else {
						/* the last chunk run in indefinitely long */
						last_chunk_in_run = Infinity; 
					}
				}
				last_sample_in_chunk += stsc.samples_per_chunk[chunk_run_index];
				sample.chunk_run_index = chunk_run_index;
			}	
			sample.description_index = stsc.sample_description_index[sample.chunk_run_index];
			sample.offset = stco.chunk_offsets[sample.chunk_index] + offset_in_chunk;
			offset_in_chunk += sample.size;
			/* setting dts, cts, duration and rap flags */
			if (j >= last_sample_in_stts_run) {
				stts_run_index++;
				if (last_sample_in_stts_run < 0) {
					last_sample_in_stts_run = 0;
				}
				last_sample_in_stts_run += stts.sample_counts[stts_run_index];				
			}
			if (j > 0) {
				sample.dts = trak.samples[j-1].dts + stts.sample_deltas[stts_run_index];
				trak.samples[j-1].duration = sample.dts - trak.samples[j-1].dts;
			} else {
				sample.dts = 0;
			}
			if (ctts) {
				if (j >= last_sample_in_ctts_run) {
					ctts_run_index++;
					if (last_sample_in_ctts_run < 0) {
						last_sample_in_ctts_run = 0;
					}
					last_sample_in_ctts_run += ctts.sample_counts[ctts_run_index];				
				}
				sample.cts = trak.samples[j].dts + ctts.sample_offsets[ctts_run_index];
			} else {
				sample.cts = sample.dts;
			}
			if (stss) {
				if (j == stss.sample_numbers[last_stss_index] - 1) { // sample numbers are 1-based
					sample.is_rap = true;
					last_stss_index++;
				} else {
					sample.is_rap = false;				
				}
			} else {
				sample.is_rap = true;
			}
		}
		if (j>0) trak.samples[j-1].duration = trak.mdia.mdhd.duration - trak.samples[j-1].dts;
	}
}

ISOFile.prototype.getCodecs = function() {	
	var i;
	var codecs = "";
	for (i = 0; i < this.moov.traks.length; i++) {
		var trak = this.moov.traks[i];
		if (i>0) {
			codecs+=","; 
		}
		codecs += trak.mdia.minf.stbl.stsd.entries[0].getCodec();		
	}
	return codecs;
}

ISOFile.prototype.getTrackById = function(id) {
	for (var j = 0; j < this.moov.traks.length; j++) {
		var trak = this.moov.traks[j];
		if (trak.tkhd.track_id == id) return trak;
	}
	return null;
}


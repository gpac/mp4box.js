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
var ISOFile = function (stream) {
	this.stream = stream;
	this.boxes = new Array();
	this.mdats = new Array();
	this.moofs = new Array();
	this.isProgressive = false;
	/* Index of the last moof box received */
	this.lastMoofIndex = 0;
	/* position of the beginning of the current buffer in the (virtual) file */
	this.bufferFilePosition = 0;
	/* position in the current buffer of the beginning of the last box parsed */
	this.lastPosition = 0;
	/* indicator if the parsing is stuck in the middle of an mdat box */
	this.parsingMdat = false;
	/* list of discontinuity in the buffer */
	this.offsetAdjusts = [];
}

ISOFile.prototype.findMdatEnd = function(box, size) {
	/* if there are no more buffers to parse, we wait for the next one to arrive */
	if (this.stream.nextBuffers.length==0) {
		return false;
	} else {					
		/* check which existing buffers contain data for this mdat */
		var length = this.stream.buffer.byteLength - this.stream.position;
		while (this.stream.nextBuffers.length > 0) {
			this.bufferFilePosition += this.stream.buffer.byteLength;
			/* using a new buffer */
			this.stream.buffer = this.stream.nextBuffers.shift();
			this.lastPosition = 0;
			this.stream.position = 0;
			length += this.stream.buffer.byteLength;
			var obj = { 
				data: this.stream.buffer,
				dataStart: 0,
				fileStart: this.bufferFilePosition
			};
			box.buffers.push(obj);
			if (length > size) {
				/* we've found the end of the mdat */
				obj.dataEnd = this.stream.buffer.byteLength - (length - ret.size);				
				this.parsingMdat = false;
				this.lastPosition = obj.dataEnd;
				this.stream.position = obj.dataEnd;
				return true;
			}
		} 
		return false; 
	}		
}

ISOFile.prototype.parse = function() {
	var found;
	var ret;
	var box;
	this.stream.seek(this.lastPosition);
	while (!this.stream.isEof()) {
		/* check if we are in the parsing of an incomplete mdat box */
		if (this.parsingMdat) {
			box = this.mdats[this.mdats.length - 1];
			found = this.findMdatEnd(box, box.size+box.hdr_size);
			if (found) {
				/* let's see if we can parse more in this buffer */
				continue;
			} else {
				/* let's wait for more buffer to come */
				return;
			}
		} else {		
			/* remember the position of the box start in case we need to role back */
			this.lastPosition = this.stream.position;
			ret = BoxParser.parseOneBox(this.stream);
			if (ret.code == BoxParser.ERR_NOT_ENOUGH_DATA) {		
				/* we did not have enough bytes to parse the entire box */
				if (ret.type === "mdat") { 
					/* we had enough bytes to get its type and size */
					/* special handling for mdat boxes */					
					this.parsingMdat = true;
					box = new BoxParser[ret.type+"Box"](ret.size-ret.hdr_size);	
					box.hdr_size = ret.hdr_size;
					box.buffers = [];
					box.buffers[0] = { 
						data: this.stream.buffer, 
						dataStart: this.stream.position, 
						fileStart: this.bufferFilePosition
					};
					this.mdats.push(box);			
					
					found = this.findMdatEnd(box, box.size+box.hdr_size);
					if (found) {
						/* let's see if we can parse more in this buffer */
						continue;
					} else {
						/* let's wait for more buffer to come */
						return;
					}
				} else {
					/* either it's not an mdat box or we did not have enough data to parse the type and size of the box, 
					   so we concatenate with the next buffer if possible to restart parsing */
					if (this.stream.nextBuffers.length > 0) {
						var oldLength = this.stream.buffer.byteLength;
						this.stream.buffer = ArrayBuffer.concat(this.stream.buffer, this.stream.nextBuffers.shift());
						Log.d("ISOFile", "Concatenating buffer for box parsing length: "+oldLength+"->"+this.stream.buffer.byteLength);
						continue;
					} else {
						/* not enough buffers received, wait */
						return;
					}
				}
			} else {
				/* the box is entirely parsed */
				box = ret.box;
				/* store the box in the 'boxes' array to preserve box order (for offset) 
				   but also store box in a property for more direct access */
				this.boxes.push(box);
				switch (box.type) {
					case "mdat":
						this.mdats.push(box);
						box.buffers = [ { data: this.stream.buffer, 
										  dataStart: start, 
										  dataEnd: this.stream.position,
										  fileStart: this.bufferFilePosition
									  } ];
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
	}
}

ISOFile.prototype.write = function(outstream) {
	for (var i=0; i<this.boxes.length; i++) {
		this.boxes[i].write(outstream);
	}
}

ISOFile.prototype.writeInitializationSegment = function(outstream) {
	this.ftyp.write(outstream);
	if (this.moov.mvex) {
		var index;
		this.initial_duration = this.moov.mvex.fragment_duration;
		for (var i = 0; i < this.moov.boxes.length; i++) {
			var box = this.moov.boxes[i];
			if (box == this.moov.mvex) {
				index = i;
			}
		}
		if (index > -1) {
			this.moov.boxes.splice(index, 1);
		}
		
	}
	var mvex = new BoxParser.mvexBox();
	this.moov.boxes.push(mvex);
	var mehd = new BoxParser.mehdBox();
	mvex.boxes.push(mehd);
	mehd.fragment_duration = this.initial_duration;
	for (var i = 0; i < this.moov.traks.length; i++) {
		var trex = new BoxParser.trexBox();
		mvex.boxes.push(trex);
		trex.track_id = this.moov.traks[i].tkhd.track_id;
		trex.default_sample_description_index = 1;
		trex.default_sample_duration = (this.moov.traks[i].samples.length>0 ? this.moov.traks[i].samples[0].duration: 0);
		trex.default_sample_size = 0;
		trex.default_sample_flags = 1<<16;
	}
	this.moov.write(outstream);
}

ISOFile.prototype.resetTables = function () {
	var i;
	var trak, stco, stsc, stsz, stts, ctts, stss;
	this.initial_duration = this.moov.mvhd.duration;
	this.moov.mvhd.duration = 0;
	for (i = 0; i < this.moov.traks.length; i++) {
		trak = this.moov.traks[i];
		trak.tkhd.duration = 0;
		trak.mdia.mdhd.duration = 0;
		stco = trak.mdia.minf.stbl.stco || trak.mdia.minf.stbl.co64;
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
	}
}

ISOFile.prototype.buildSampleLists = function() {	
	var i, j, k;
	var trak, stco, stsc, stsz, stts, ctts, stss, stsd, subs;
	var chunk_run_index, chunk_index, last_chunk_in_run, offset_in_chunk, last_sample_in_chunk;
	var last_sample_in_stts_run, stts_run_index, last_sample_in_ctts_run, ctts_run_index, last_stss_index, last_subs_index;
	for (i = 0; i < this.moov.traks.length; i++) {
		trak = this.moov.traks[i];
		trak.samples = new Array();
		stco = trak.mdia.minf.stbl.stco || trak.mdia.minf.stbl.co64;
		stsc = trak.mdia.minf.stbl.stsc;
		stsz = trak.mdia.minf.stbl.stsz;
		stts = trak.mdia.minf.stbl.stts;
		ctts = trak.mdia.minf.stbl.ctts;
		stss = trak.mdia.minf.stbl.stss;
		stsd = trak.mdia.minf.stbl.stsd;
		subs = trak.mdia.minf.stbl.subs;
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
		subs_entry_index = 0;
		last_subs_sample_index = 0;
		/* we build the samples one by one and compute their properties */
		for (j = 0; j < stsz.sample_sizes.length; j++) {
			var sample = {};
			sample.track_id = trak.tkhd.track_id;
			sample.timescale = trak.mdia.mdhd.timescale;
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
			sample.description = stsd.entries[stsc.sample_description_index[sample.chunk_run_index]-1];
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
			if (subs) {
				if (subs.samples[subs_entry_index].sample_delta + last_subs_sample_index == j) {
					sample.subsamples = subs.samples[subs_entry_index].subsamples;
					last_subs_sample_index += subs.samples[subs_entry_index].sample_delta;
				}
			}
		}
		if (j>0) trak.samples[j-1].duration = trak.mdia.mdhd.duration - trak.samples[j-1].dts;
	}
}

ISOFile.prototype.getTrexById = function(id) {	
	var i;
	if (!this.moov || !this.moov.mvex) return null;
	for (i = 0; i < this.moov.mvex.trexs.length; i++) {
		var trex = this.moov.mvex.trexs[i];
		if (trex.track_id == id) return trex;
	}
	return null;
}

ISOFile.prototype.updateSampleLists = function() {	
	var i, j, k;
	var default_sample_description_index, default_sample_duration, default_sample_size, default_sample_flags;
	var last_run_position;
	var box, moof, traf, trak, trex;
	
	while (this.lastMoofIndex < this.boxes.length) {
		box = this.boxes[this.lastMoofIndex];
		this.lastMoofIndex++;
		if (box.type == "moof") {
			moof = box;
			for (i = 0; i < moof.trafs.length; i++) {
				traf = moof.trafs[i];
				trak = this.getTrackById(traf.tfhd.track_id);
				trex = this.getTrexById(traf.tfhd.track_id);
				if (traf.tfhd.flags & BoxParser.TFHD_FLAG_SAMPLE_DESC) {
					default_sample_description_index = traf.tfhd.default_sample_description_index;
				} else {
					default_sample_description_index = trex.default_sample_description_index;
				}
				if (traf.tfhd.flags & BoxParser.TFHD_FLAG_SAMPLE_DUR) {
					default_sample_duration = traf.tfhd.default_sample_duration;
				} else {
					default_sample_duration = trex.default_sample_duration;
				}
				if (traf.tfhd.flags & BoxParser.TFHD_FLAG_SAMPLE_SIZE) {
					default_sample_size = traf.tfhd.default_sample_size;
				} else {
					default_sample_size = trex.default_sample_size;
				}
				if (traf.tfhd.flags & BoxParser.TFHD_FLAG_SAMPLE_FLAGS) {
					default_sample_flags = traf.tfhd.default_sample_flags;
				} else {
					default_sample_flags = trex.default_sample_flags;
				}
				for (j = 0; j < traf.truns.length; j++) {
					var trun = traf.truns[j];
					for (k = 0; k < trun.sample_count; k++) {
						var sample = {};
						traf.first_sample_index = trak.samples.length;
						trak.samples.push(sample);
						sample.track_id = trak.tkhd.track_id;
						sample.timescale = trak.mdia.mdhd.timescale;
						sample.description = trak.mdia.minf.stbl.stsd.entries[default_sample_description_index-1];
						sample.size = default_sample_size;
						if (trun.flags & BoxParser.TRUN_FLAGS_SIZE) {
							sample.size = trun.sample_size[k];
						}
						sample.duration = default_sample_duration;
						if (trun.flags & BoxParser.TRUN_FLAGS_DURATION) {
							sample.duration = trun.sample_duration[k];
						}
						if (trak.first_traf_merged || k > 0) {
							sample.dts = trak.samples[trak.samples.length-2].dts+trak.samples[trak.samples.length-2].duration;
						} else {
							if (traf.tfdt) {
								sample.dts = traf.tfdt.baseMediaDecodeTime;
							} else {
								sample.dts = 0;
							}
							trak.first_traf_merged = true;
						}
						sample.cts = sample.dts;
						if (trun.flags & BoxParser.TRUN_FLAGS_CTS_OFFSET) {
							sample.cts = sample.dts + trun.sample_composition_time_offset[k];
						}
						sample_flags = default_sample_flags;
						if (trun.flags & BoxParser.TRUN_FLAGS_FLAGS) {
							sample_flags = trun.sample_flags[k];
						} else if (k == 0 && (trun.flags & BoxParser.TRUN_FLAGS_FIRST_FLAG)) {
							sample_flags = trun.first_sample_flags;
						}
						sample.is_rap = ((sample_flags >> 16 & 0x1) ? false : true);
						var bdop = (traf.tfhd.flags & BoxParser.TFHD_FLAG_BASE_DATA_OFFSET) ? true : false;
						var dbim = (traf.tfhd.flags & BoxParser.TFHD_FLAG_DEFAULT_BASE_IS_MOOF) ? true : false;
						var dop = (trun.flags & BoxParser.TRUN_FLAGS_DATA_OFFSET) ? true : false;
						var bdo = 0;
						if (!bdop) {
							if (!dbim) {
								if (j == 0) { // the first track in the movie fragment
									bdo = moof.inputStart; // the position of the first byte of the enclosing Movie Fragment Box
								} else {
									bdo = last_run_position; // end of the data defined by the preceding *track* (irrespective of the track id) fragment in the moof
								}
							} else {
								bdo = moof.inputStart;
							}
						} else {
							bdo = tfhd.base_data_offset;
						}
						if (j == 0 && k == 0) {
							if (dop) {
								sample.offset = bdo + trun.data_offset; // If the data-offset is present, it is relative to the base-data-offset established in the track fragment header
							} else {
								sample.offset = bdo; // the data for this run starts the base-data-offset defined by the track fragment header
							}
						} else {
							sample.offset = last_run_position; // this run starts immediately after the data of the previous run
						}
						last_run_position = sample.offset + sample.size;
					}
				}
				if (traf.subs) {
					var sample_index = traf.first_sample_index;
					for (j = 0; j < traf.subs.samples.length; j++) {
						sample_index += traf.subs.samples[j].sample_delta;
						var sample = trak.samples[sample_index-1];
						sample.subsamples = traf.subs.samples[j].subsamples;
					}					
				}
			}
		}
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

ISOFile.prototype.getAdjustedPosition = function (pos) {
	/* This assumes that the adjustements are cumulated and sorted by original positions */
	for (var i = this.offsetAdjusts.length-1; i >= 0 ; i--) {
		var adjust = this.offsetAdjusts[i];
		if (pos > adjust.position) {
			return pos - adjust.offset;
		} 
	}
	return pos;
}

ISOFile.prototype.insertAdjust = function(adj) {
	var entry;
	var added = false;
	var nextI;
	/* The list of position adjustments is sorted by original positions, 
	   so we start from the end assuming the new adjustment is (very likely to be) after the previous one */
	for (var i = this.offsetAdjusts.length-1; i >= 0 ; i--) {
		entry = this.offsetAdjusts[i];
		if (entry.position < adj.position) {
			/* The new adjustment is after this one */
			if (entry.position+entry.size == adj.position) {
				/* the new adjustment is contiguous with this one, so we merge them */
				entry.size += adj.offset;
				entry.offset += adj.offset;
				if (this.offsetAdjusts.length > i+1) { 
					/* if there is a entry after this one, we need to check it */
					var nextEntry = this.offsetAdjusts[i+1];
					if (entry.position+entry.size == nextEntry.position) { 
						/* the extended entry is contiguous with the previous one, so we merge them */
						entry.size += nextEntry.size;
						this.offsetAdjusts.splice(i+1, 1);
					} else {
						/* the next entry is still not contiguous */
					}
				}
				nextI = i+1;
			} else {
				/* the new adjustment cannot be merged with the previous one, we insert it */
				this.offsetAdjusts.splice(i+1, 0, adj);
				/* accumulate with the offset of the previous entry */
				adj.size = adj.offset;
				adj.offset += entry.offset;
				nextI = i+2;
			}		
			/* add the new offset to all future adjustments */
			for (var j = nextI; j < this.offsetAdjusts.length; j++) {
				this.offsetAdjusts[j].offset += adj.offset;
			}
			added = true;
			break;
		} else {
			/* The new adjustment is before this one, check the previous one */
		}
	}
	if (!added) {
		adj.size = adj.offset;
		this.offsetAdjusts.push(adj);
		if (this.offsetAdjusts.length > 1) {
			adj.offset += this.offsetAdjusts[this.offsetAdjusts.length-2].offset;
		}
	}
	Log.d("MP4Box", "Number of entries in the list of position adjustments: "+this.offsetAdjusts.length);
}

ISOFile.prototype.getSample = function(trak, sampleNum) {	
	var mdat;
	var buffer;
	var i, j;
	var sample = trak.samples[sampleNum];
	
	if (!sample.data) {
		sample.data = new Uint8Array(sample.size);
		sample.alreadyRead = 0;
	} else if (sample.alreadyRead == sample.size) {
		return sample;
	}
	for (i = 0; i < this.mdats.length; i++) {
		mdat = this.mdats[i];
		for (j = 0; j < mdat.buffers.length; j++) {
			buffer = mdat.buffers[j];
			if (sample.offset + sample.alreadyRead >= buffer.fileStart &&
			    sample.offset + sample.alreadyRead <  buffer.fileStart + buffer.data.byteLength) {
				/* The sample starts in this buffer */
				var lengthAfterStart = buffer.data.byteLength - (sample.offset + sample.alreadyRead - buffer.fileStart);
				if (sample.size - sample.alreadyRead <= lengthAfterStart) {
					/* the sample is entirely contained in this buffer */
					Log.d("ISOFile","Getting sample data (alreadyRead: "+sample.alreadyRead+" offset: "+(sample.offset+sample.alreadyRead - buffer.fileStart)+" size: "+(sample.size - sample.alreadyRead)+")");
					DataStream.memcpy(sample.data.buffer, sample.alreadyRead, 
					                  buffer.data, sample.offset+sample.alreadyRead - buffer.fileStart, sample.size - sample.alreadyRead);
					sample.alreadyRead = sample.size;
					return sample;
				} else {
					/* the sample does not end in this buffer */				
					Log.d("ISOFile","Getting sample data (alreadyRead: "+sample.alreadyRead+" offset: "+(sample.offset+sample.alreadyRead - buffer.fileStart)+" size: "+lengthAfterStart+")");
					DataStream.memcpy(sample.data.buffer, sample.alreadyRead, 
					                  buffer.data, sample.offset+sample.alreadyRead - buffer.fileStart, lengthAfterStart);
					sample.alreadyRead += lengthAfterStart;
				}
			}
		}
	}	
/*	var adjustedOffset = this.getAdjustedPosition(sample.offset);	
	if (adjustedOffset+sample.size <= this.stream.byteLength) {
		this.stream.seek(adjustedOffset);
		sample.data = this.stream.readUint8Array(sample.size);
		return sample;
	}
*/
/*	
	for (i = 0; i< this.mdats.length; i++) {
		mdat = this.mdats[i];
//		if (sample.offset >= mdat.start && sample.offset+sample.size <= mdat.start+mdat.size) {
//		if (sample.offset >= mdat.filePos && sample.offset+sample.size <= mdat.filePos+mdat.size) {
			this.stream.seek(mdat.start + (sample.offset - mdat.filePos));
			sample.data = this.stream.readUint8Array(sample.size);
			return sample;
		}
	}
*/
	return null;
}

ISOFile.prototype.releaseData = function(offset, size) {	
	var adjustedOffset = this.getAdjustedPosition(offset);	
	DataStream.memcpy(this.stream.buffer, adjustedOffset, 
	                  this.stream.buffer, adjustedOffset+size, this.stream.buffer.byteLength-adjustedOffset-size);	
	this.insertAdjust({position: offset, offset: size});	
	if (this.stream._byteLength < size) {
		throw "Size problem";
	}
	this.stream._byteLength -= size;
	if (this.stream.position>adjustedOffset) this.stream.position -= size;
	Log.d("MP4Box", "Released data of size "+size+" at position "+adjustedOffset+", new buffer size: "+this.stream.buffer.byteLength);
}

ISOFile.prototype.releaseSample = function(trak, sampleNum) {	

	return;
	
	var sample = trak.samples[sampleNum];
	Log.d("MP4Box", "Track #"+trak.tkhd.track_id+" Trying to release sample #"+sampleNum+", buffer size: "+this.stream.buffer.byteLength+", initial offset: "+sample.offset+", size:"+sample.size+", new offset: "+sample.newOffset);
	this.releaseData(sample.offset, sample.size);
	return sample.size;
}
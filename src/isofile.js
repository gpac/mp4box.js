/* 
 * Copyright (c) 2012-2013. Telecom ParisTech/TSI/MM/GPAC Cyril Concolato
 * License: BSD-3-Clause (see LICENSE file)
 */
var ISOFile = function (stream) {
	this.stream = stream;
	this.boxes = new Array();
	this.mdats = new Array();
	this.moofs = new Array();
	this.isProgressive = false;
	/* Index of the last moof box received */
	this.lastMoofIndex = 0;
	/* position in the current buffer of the beginning of the last box parsed */
	this.lastPosition = 0;
	/* indicator if the parsing is stuck in the middle of an mdat box */
	this.parsingMdat = false;
	/* to fire moov start event */
	this.moovStartFound = false;
	/* size of the buffers allocated for samples */
	this.samplesDataSize = 0;
	/* next file position that the parser needs */
	this.nextParsePosition = 0;
}

ISOFile.prototype.findMdatEnd = function(box, size) {
	/* check which existing buffers contain data for this mdat, if any */
	while (true) {
		/* Check if the end of the mdat is in this buffer */
		if (box.fileStart + size <= this.stream.buffer.fileStart + this.stream.buffer.byteLength) {
			/* we've found the end of the mdat */
			this.parsingMdat = false;
			this.lastPosition = box.fileStart + size - this.stream.buffer.fileStart;
			this.stream.position = this.lastPosition;
			Log.d("ISOFile", "Using new buffer from position "+this.lastPosition);
			return true;
		} 
		if (this.stream.nextBuffers.length > 0) {
			var next_buffer = this.stream.nextBuffers[0];
			if (next_buffer.fileStart == this.stream.buffer.fileStart + this.stream.buffer.byteLength) {
				this.lastPosition = 0;
				this.stream.position = this.lastPosition;
				/* We will forget the current buffer (referenced in the mdat anyway) 
					we need to advance the position in the file to start with the new buffer */
				Log.d("ISOFile", "Releasing buffer (file start:"+ this.stream.buffer.fileStart+", size "+this.stream.buffer.byteLength+")");
				/* Get a new buffer */
				this.stream.buffer = this.stream.nextBuffers.shift();
				Log.d("ISOFile", "Using new buffer (file start:"+ this.stream.buffer.fileStart+", size "+this.stream.buffer.byteLength+")");
				/* Mark the buffer as being useful for the current mdat */
				box.buffers.push(this.stream.buffer);
				Log.d("ISOFile","Adding buffer for mdat ("+box.buffers.length+" buffers left)");
			} else {
				this.nextParsePosition = this.stream.buffer.fileStart+this.stream.buffer.byteLength;
				break;
			}
		} else {
			this.nextParsePosition = this.stream.buffer.fileStart+this.stream.buffer.byteLength;
			break;
		}
	} 
	return false; 
}

ISOFile.prototype.parse = function() {
	var found;
	var ret;
	var box;
	Log.d("ISOFile","Starting parsing from position "+this.lastPosition+" in the current buffer and from "+(this.stream.buffer.fileStart+this.lastPosition)+" in the file");
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
			/* remember the position of the box start in case we need to roll back */
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
					box.buffers[0] = this.stream.buffer;
					box.fileStart = this.stream.buffer.fileStart + this.stream.position;
					this.stream.buffer.usedBytes += ret.hdr_size;
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
					if (ret.type === "moov") { 
						this.moovStartFound = true;
					}
					/* either it's not an mdat box or we did not have enough data to parse the type and size of the box, 
					   so we try to concatenate with the next buffer if possible to restart parsing */
					if (this.stream.nextBuffers.length > 0) {
						var next_buffer = this.stream.nextBuffers[0];
						if (next_buffer.fileStart == this.stream.buffer.fileStart + this.stream.buffer.byteLength) {
							var oldLength = this.stream.buffer.byteLength;
							var oldUsedBytes = this.stream.buffer.usedBytes;
							var oldFileStart = this.stream.buffer.fileStart;
							this.stream.buffer = ArrayBuffer.concat(this.stream.buffer, this.stream.nextBuffers.shift());
							this.stream.buffer.usedBytes = oldUsedBytes;
							this.stream.buffer.fileStart = oldFileStart;						
							this.nextParsePosition = this.stream.buffer.fileStart + this.stream.buffer.byteLength;
							Log.d("ISOFile", "Concatenating buffer for box parsing length: "+oldLength+"->"+this.stream.buffer.byteLength);
							continue;
						} else {
							/* we cannot concatenate because the buffers are not contiguous */
							this.nextParsePosition = this.stream.buffer.fileStart + this.stream.buffer.byteLength;
							return;
						}
					} else {
						/* not enough buffers received, wait */
						if (!ret.type) {
							/* There were not enough bytes in the buffer to parse the box type and length,
							   the next fetch should retrieve those missing bytes, i.e. the next bytes after this buffer */
							this.nextParsePosition = this.stream.buffer.fileStart + this.stream.buffer.byteLength;
						} else {
							/* we had enough bytes to parse size and type of the incomplete box
							   if we haven't found yet the moov box, skip this one and try the next one 
							   if we have found the moov box, let's continue linear parsing */
							if (this.moovStartFound) {
								this.nextParsePosition = this.stream.buffer.fileStart + this.stream.buffer.byteLength;
							} else {
								this.nextParsePosition = this.stream.buffer.fileStart + this.stream.position + ret.size;
							}
						}
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
						box.fileStart = this.stream.buffer.fileStart + box.start;
						box.buffers = [ this.stream.buffer ];
						this.stream.buffer.usedBytes += box.hdr_size;
						break;
					case "moof":
						this.moofs.push(box);
						this.stream.buffer.usedBytes += ret.size;
						break;
					case "moov":
						if (this.mdats.length == 0) {
							this.isProgressive = true;
						}
					default:
						this[box.type] = box;
						this.stream.buffer.usedBytes += ret.size;
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
	Log.d("ISOFile", "Generating initialization segment");
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
	
	while (this.lastMoofIndex < this.moofs.length) {
		box = this.moofs[this.lastMoofIndex];
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
									bdo = moof.fileStart; // the position of the first byte of the enclosing Movie Fragment Box
								} else {
									bdo = last_run_position; // end of the data defined by the preceding *track* (irrespective of the track id) fragment in the moof
								}
							} else {
								bdo = moof.fileStart;
							}
						} else {
							bdo = traf.tfhd.base_data_offset;
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

ISOFile.prototype.getSample = function(trak, sampleNum) {	
	var mdat;
	var buffer;
	var i, j;
	var sample = trak.samples[sampleNum];
	
	if (!sample.data) {
		sample.data = new Uint8Array(sample.size);
		sample.alreadyRead = 0;
		this.samplesDataSize += sample.size;
		Log.d("ISOFile", "Allocating sample #"+sampleNum+" on track #"+trak.tkhd.track_id+" of size "+sample.size+" (total: "+this.samplesDataSize+")");
	} else if (sample.alreadyRead == sample.size) {
		return sample;
	}
	for (i = 0; i < this.mdats.length; i++) {
		mdat = this.mdats[i];
		for (j = 0; j < mdat.buffers.length; j++) {
			buffer = mdat.buffers[j];
			if (sample.offset + sample.alreadyRead >= buffer.fileStart &&
			    sample.offset + sample.alreadyRead <  buffer.fileStart + buffer.byteLength) {
				/* The sample starts in this buffer */
				var lengthAfterStart = buffer.byteLength - (sample.offset + sample.alreadyRead - buffer.fileStart);
				if (sample.size - sample.alreadyRead <= lengthAfterStart) {
					/* the sample is entirely contained in this buffer */
					Log.d("ISOFile","Getting sample #"+sampleNum+" data (alreadyRead: "+sample.alreadyRead+" offset: "+(sample.offset+sample.alreadyRead - buffer.fileStart)+" size: "+(sample.size - sample.alreadyRead)+")");
					DataStream.memcpy(sample.data.buffer, sample.alreadyRead, 
					                  buffer, sample.offset+sample.alreadyRead - buffer.fileStart, sample.size - sample.alreadyRead);
					buffer.usedBytes += sample.size - sample.alreadyRead;
					sample.alreadyRead = sample.size;
					if (buffer.usedBytes == buffer.byteLength) {
						mdat.buffers.splice(j, 1);
						Log.d("ISOFile","Removing buffer for mdat ("+mdat.buffers.length+" buffers left)");
						j--;
					}
					return sample;
				} else {
					/* the sample does not end in this buffer */				
					Log.d("ISOFile","Getting sample data (alreadyRead: "+sample.alreadyRead+" offset: "+(sample.offset+sample.alreadyRead - buffer.fileStart)+" size: "+lengthAfterStart+")");
					DataStream.memcpy(sample.data.buffer, sample.alreadyRead, 
					                  buffer, sample.offset+sample.alreadyRead - buffer.fileStart, lengthAfterStart);
					buffer.usedBytes += lengthAfterStart;
					if (buffer.usedBytes == buffer.byteLength) {
						mdat.buffers.splice(j, 1);
						Log.d("ISOFile","Removing buffer for mdat ("+mdat.buffers.length+" buffers left)");
						j--;
					}
					sample.alreadyRead += lengthAfterStart;
				}
			}
		}
		if (mdat.buffers.length == 0 && this.mdats.length > 1) {
			this.mdats.splice(i, 1);
			i--;
		}
	}		

	return null;
}

ISOFile.prototype.releaseSample = function(trak, sampleNum) {	
	var sample = trak.samples[sampleNum];
	sample.data = null;
	this.samplesDataSize -= sample.size;
	return sample.size;
}

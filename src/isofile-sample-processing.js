/* Index of the last moof box received */
ISOFile.prototype.lastMoofIndex = 0;

/* size of the buffers allocated for samples */
ISOFile.prototype.samplesDataSize = 0;

/* Resets all sample tables */
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
		stco.chunk_offsets = [];
		stsc = trak.mdia.minf.stbl.stsc;
		stsc.first_chunk = [];
		stsc.samples_per_chunk = [];
		stsc.sample_description_index = [];
		stsz = trak.mdia.minf.stbl.stsz || trak.mdia.minf.stbl.stz2;
		stsz.sample_sizes = [];
		stts = trak.mdia.minf.stbl.stts;
		stts.sample_counts = [];
		stts.sample_deltas = [];
		ctts = trak.mdia.minf.stbl.ctts;
		if (ctts) {
			ctts.sample_counts = [];
			ctts.sample_offsets = [];
		}
		stss = trak.mdia.minf.stbl.stss;
		var k = trak.mdia.minf.stbl.boxes.indexOf(stss);
		if (k != -1) trak.mdia.minf.stbl.boxes[k] = null;
	}
}

ISOFile.initSampleGroups = function(trak, traf, sbgps, trak_sgpds, traf_sgpds) {
	var l;
	var k;
	var sample_groups_info;
	var sample_group_info;
	var sample_group_key;
	function SampleGroupInfo(_type, _parameter, _sbgp) {
		this.grouping_type = _type;
		this.grouping_type_parameter = _parameter;
		this.sbgp = _sbgp;
		this.last_sample_in_run = -1;
		this.entry_index = -1;		
	}
	if (traf) {
		traf.sample_groups_info = [];
	} 
	if (!trak.sample_groups_info) {
		trak.sample_groups_info = [];
	}
	for (k = 0; k < sbgps.length; k++) {
		sample_group_key = sbgps[k].grouping_type +"/"+ sbgps[k].grouping_type_parameter;
		sample_group_info = new SampleGroupInfo(sbgps[k].grouping_type, sbgps[k].grouping_type_parameter, sbgps[k]);
		if (traf) {
			traf.sample_groups_info[sample_group_key] = sample_group_info;
		}
		if (!trak.sample_groups_info[sample_group_key]) {
			trak.sample_groups_info[sample_group_key] = sample_group_info;
		}
		for (l=0; l <trak_sgpds.length; l++) {
			if (trak_sgpds[l].grouping_type === sbgps[k].grouping_type) {
				sample_group_info.description = trak_sgpds[l];
				sample_group_info.description.used = true;
			}
		}
		if (traf_sgpds) {
			for (l=0; l <traf_sgpds.length; l++) {
				if (traf_sgpds[l].grouping_type === sbgps[k].grouping_type) {
					sample_group_info.fragment_description = traf_sgpds[l];
					sample_group_info.fragment_description.used = true;
					sample_group_info.is_fragment = true;
				}
			}			
		}
	}
	if (!traf) {
		for (k = 0; k < trak_sgpds.length; k++) {
			if (!trak_sgpds[k].used && trak_sgpds[k].version >= 2) {
				sample_group_key = trak_sgpds[k].grouping_type +"/0";
				sample_group_info = new SampleGroupInfo(trak_sgpds[k].grouping_type, 0);
				if (!trak.sample_groups_info[sample_group_key]) {
					trak.sample_groups_info[sample_group_key] = sample_group_info;
				}
			}
		}
	} else {
		if (traf_sgpds) {
			for (k = 0; k < traf_sgpds.length; k++) {
				if (!traf_sgpds[k].used && traf_sgpds[k].version >= 2) {
					sample_group_key = traf_sgpds[k].grouping_type +"/0";
					sample_group_info = new SampleGroupInfo(traf_sgpds[k].grouping_type, 0);
					sample_group_info.is_fragment = true;
					if (!traf.sample_groups_info[sample_group_key]) {
						traf.sample_groups_info[sample_group_key] = sample_group_info;
					}
				}
			}
		}
	}
}

ISOFile.setSampleGroupProperties = function(trak, sample, sample_number, sample_groups_info) {
	var k;
	var index;
	sample.sample_groups = [];
	for (k in sample_groups_info) {
		sample.sample_groups[k] = {};
		sample.sample_groups[k].grouping_type = sample_groups_info[k].grouping_type;
		sample.sample_groups[k].grouping_type_parameter = sample_groups_info[k].grouping_type_parameter;
		if (sample_number >= sample_groups_info[k].last_sample_in_run) {
			if (sample_groups_info[k].last_sample_in_run < 0) {
				sample_groups_info[k].last_sample_in_run = 0;
			}
			sample_groups_info[k].entry_index++;	
			if (sample_groups_info[k].entry_index <= sample_groups_info[k].sbgp.entries.length - 1) {
				sample_groups_info[k].last_sample_in_run += sample_groups_info[k].sbgp.entries[sample_groups_info[k].entry_index].sample_count;
			}
		}
		if (sample_groups_info[k].entry_index <= sample_groups_info[k].sbgp.entries.length - 1) {
			sample.sample_groups[k].group_description_index = sample_groups_info[k].sbgp.entries[sample_groups_info[k].entry_index].group_description_index;
		} else {
			sample.sample_groups[k].group_description_index = -1; // special value for not defined
		}
		if (sample.sample_groups[k].group_description_index !== 0) {
			var description;
			if (sample_groups_info[k].fragment_description) {
				description = sample_groups_info[k].fragment_description;
			} else {
				description = sample_groups_info[k].description;
			}
			if (sample.sample_groups[k].group_description_index > 0) {
				if (sample.sample_groups[k].group_description_index > 65535) {
					index = (sample.sample_groups[k].group_description_index >> 16)-1;
				} else {
					index = sample.sample_groups[k].group_description_index-1;
				}
				if (description && index >= 0) {
					sample.sample_groups[k].description = description.entries[index];
				}
			} else {
				if (description && description.version >= 2) {
					if (description.default_group_description_index > 0) {								
						sample.sample_groups[k].description = description.entries[description.default_group_description_index-1];
					}
				}
			}
		}
	}
}

ISOFile.process_sdtp = function (sdtp, sample, number) {
	if (!sample) {
		return;
	}
	if (sdtp) {
		sample.is_leading = sdtp.is_leading[number];
		sample.depends_on = sdtp.sample_depends_on[number];
		sample.is_depended_on = sdtp.sample_is_depended_on[number];
		sample.has_redundancy = sdtp.sample_has_redundancy[number];
	} else {
		sample.is_leading = 0;
		sample.depends_on = 0;
		sample.is_depended_on = 0
		sample.has_redundancy = 0;
	}	
}

/* Build initial sample list from  sample tables */
ISOFile.prototype.buildSampleLists = function() {	
	var i;
	var trak;
	for (i = 0; i < this.moov.traks.length; i++) {
		trak = this.moov.traks[i];
		this.buildTrakSampleLists(trak);
	}
}

ISOFile.prototype.buildTrakSampleLists = function(trak) {	
	var j, k;
	var stco, stsc, stsz, stts, ctts, stss, stsd, subs, sbgps, sgpds, stdp;
	var chunk_run_index, chunk_index, last_chunk_in_run, offset_in_chunk, last_sample_in_chunk;
	var last_sample_in_stts_run, stts_run_index, last_sample_in_ctts_run, ctts_run_index, last_stss_index, last_subs_index, subs_entry_index, last_subs_sample_index;

	trak.samples = [];
	trak.samples_duration = 0;
	trak.samples_size = 0;
	stco = trak.mdia.minf.stbl.stco || trak.mdia.minf.stbl.co64;
	stsc = trak.mdia.minf.stbl.stsc;
	stsz = trak.mdia.minf.stbl.stsz || trak.mdia.minf.stbl.stz2;
	stts = trak.mdia.minf.stbl.stts;
	ctts = trak.mdia.minf.stbl.ctts;
	stss = trak.mdia.minf.stbl.stss;
	stsd = trak.mdia.minf.stbl.stsd;
	subs = trak.mdia.minf.stbl.subs;
	stdp = trak.mdia.minf.stbl.stdp;
	sbgps = trak.mdia.minf.stbl.sbgps;
	sgpds = trak.mdia.minf.stbl.sgpds;
	
	last_sample_in_stts_run = -1;
	stts_run_index = -1;
	last_sample_in_ctts_run = -1;
	ctts_run_index = -1;
	last_stss_index = 0;
	subs_entry_index = 0;
	last_subs_sample_index = 0;		

	ISOFile.initSampleGroups(trak, null, sbgps, sgpds);

	if (typeof stsz === "undefined") {
		return;
	}

	/* we build the samples one by one and compute their properties */
	for (j = 0; j < stsz.sample_sizes.length; j++) {
		var sample = {};
		sample.number = j;
		sample.track_id = trak.tkhd.track_id;
		sample.timescale = trak.mdia.mdhd.timescale;
		sample.alreadyRead = 0;
		trak.samples[j] = sample;
		/* size can be known directly */
		sample.size = stsz.sample_sizes[j];
		trak.samples_size += sample.size;
		/* computing chunk-based properties (offset, sample description index)*/
		if (j === 0) {				
			chunk_index = 1; /* the first sample is in the first chunk (chunk indexes are 1-based) */
			chunk_run_index = 0; /* the first chunk is the first entry in the first_chunk table */
			sample.chunk_index = chunk_index;
			sample.chunk_run_index = chunk_run_index;
			last_sample_in_chunk = stsc.samples_per_chunk[chunk_run_index];
			offset_in_chunk = 0;

			/* Is there another entry in the first_chunk table ? */
			if (chunk_run_index + 1 < stsc.first_chunk.length) {
				/* The last chunk in the run is the chunk before the next first chunk */
				last_chunk_in_run = stsc.first_chunk[chunk_run_index+1]-1; 	
			} else {
				/* There is only one entry in the table, it is valid for all future chunks*/
				last_chunk_in_run = Infinity;
			}
		} else {
			if (j < last_sample_in_chunk) {
				/* the sample is still in the current chunk */
				sample.chunk_index = chunk_index;
				sample.chunk_run_index = chunk_run_index;
			} else {
				/* the sample is in the next chunk */
				chunk_index++;
				sample.chunk_index = chunk_index;
				/* reset the accumulated offset in the chunk */
				offset_in_chunk = 0;
				if (chunk_index <= last_chunk_in_run) {
					/* stay in the same entry of the first_chunk table */
					/* chunk_run_index unmodified */
				} else {
					chunk_run_index++;
					/* Is there another entry in the first_chunk table ? */
					if (chunk_run_index + 1 < stsc.first_chunk.length) {
						/* The last chunk in the run is the chunk before the next first chunk */
						last_chunk_in_run = stsc.first_chunk[chunk_run_index+1]-1; 	
					} else {
						/* There is only one entry in the table, it is valid for all future chunks*/
						last_chunk_in_run = Infinity;
					}
					
				}
				sample.chunk_run_index = chunk_run_index;
				last_sample_in_chunk += stsc.samples_per_chunk[chunk_run_index];
			}
		}

		sample.description_index = stsc.sample_description_index[sample.chunk_run_index]-1;
		sample.description = stsd.entries[sample.description_index];
		sample.offset = stco.chunk_offsets[sample.chunk_index-1] + offset_in_chunk; /* chunk indexes are 1-based */
		offset_in_chunk += sample.size;

		/* setting dts, cts, duration and rap flags */
		if (j > last_sample_in_stts_run) {
			stts_run_index++;
			if (last_sample_in_stts_run < 0) {
				last_sample_in_stts_run = 0;
			}
			last_sample_in_stts_run += stts.sample_counts[stts_run_index];				
		}
		if (j > 0) {
			trak.samples[j-1].duration = stts.sample_deltas[stts_run_index];
			trak.samples_duration += trak.samples[j-1].duration;
			sample.dts = trak.samples[j-1].dts + trak.samples[j-1].duration;
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
				sample.is_sync = true;
				last_stss_index++;
			} else {
				sample.is_sync = false;				
				sample.degradation_priority = 0;
			}
			if (subs) {
				if (subs.entries[subs_entry_index].sample_delta + last_subs_sample_index == j+1) {
					sample.subsamples = subs.entries[subs_entry_index].subsamples;
					last_subs_sample_index += subs.entries[subs_entry_index].sample_delta;
					subs_entry_index++;
				}
			}
		} else {
			sample.is_sync = true;
		}
		ISOFile.process_sdtp(trak.mdia.minf.stbl.sdtp, sample, sample.number);
		if (stdp) {
			sample.degradation_priority = stdp.priority[j];
		} else {
			sample.degradation_priority = 0;
		}
		if (subs) {
			if (subs.entries[subs_entry_index].sample_delta + last_subs_sample_index == j) {
				sample.subsamples = subs.entries[subs_entry_index].subsamples;
				last_subs_sample_index += subs.entries[subs_entry_index].sample_delta;
			}
		}
		if (sbgps.length > 0 || sgpds.length > 0) {
			ISOFile.setSampleGroupProperties(trak, sample, j, trak.sample_groups_info);
		}
	}
	if (j>0) {
		trak.samples[j-1].duration = Math.max(trak.mdia.mdhd.duration - trak.samples[j-1].dts, 0);
		trak.samples_duration += trak.samples[j-1].duration;
	}
}

/* Update sample list when new 'moof' boxes are received */
ISOFile.prototype.updateSampleLists = function() {	
	var i, j, k;
	var default_sample_description_index, default_sample_duration, default_sample_size, default_sample_flags;
	var last_run_position;
	var box, moof, traf, trak, trex;
	var sample;
	var sample_flags;
	
	if (this.moov === undefined) {
		return;
	}
	/* if the input file is fragmented and fetched in multiple downloads, we need to update the list of samples */
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
					default_sample_description_index = (trex ? trex.default_sample_description_index: 1);
				}
				if (traf.tfhd.flags & BoxParser.TFHD_FLAG_SAMPLE_DUR) {
					default_sample_duration = traf.tfhd.default_sample_duration;
				} else {
					default_sample_duration = (trex ? trex.default_sample_duration : 0);
				}
				if (traf.tfhd.flags & BoxParser.TFHD_FLAG_SAMPLE_SIZE) {
					default_sample_size = traf.tfhd.default_sample_size;
				} else {
					default_sample_size = (trex ? trex.default_sample_size : 0);
				}
				if (traf.tfhd.flags & BoxParser.TFHD_FLAG_SAMPLE_FLAGS) {
					default_sample_flags = traf.tfhd.default_sample_flags;
				} else {
					default_sample_flags = (trex ? trex.default_sample_flags : 0);
				}
				traf.sample_number = 0;
				/* process sample groups */
				if (traf.sbgps.length > 0) {
					ISOFile.initSampleGroups(trak, traf, traf.sbgps, trak.mdia.minf.stbl.sgpds, traf.sgpds);
				}
				for (j = 0; j < traf.truns.length; j++) {
					var trun = traf.truns[j];
					for (k = 0; k < trun.sample_count; k++) {
						sample = {};
						sample.moof_number = this.lastMoofIndex;
						sample.number_in_traf = traf.sample_number;
						traf.sample_number++;
			            sample.number = trak.samples.length;
						traf.first_sample_index = trak.samples.length;
						trak.samples.push(sample);
						sample.track_id = trak.tkhd.track_id;
						sample.timescale = trak.mdia.mdhd.timescale;
						sample.description_index = default_sample_description_index-1;
						sample.description = trak.mdia.minf.stbl.stsd.entries[sample.description_index];
						sample.size = default_sample_size;
						if (trun.flags & BoxParser.TRUN_FLAGS_SIZE) {
							sample.size = trun.sample_size[k];
						}
						trak.samples_size += sample.size;
						sample.duration = default_sample_duration;
						if (trun.flags & BoxParser.TRUN_FLAGS_DURATION) {
							sample.duration = trun.sample_duration[k];
						}
						trak.samples_duration += sample.duration;
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
						} else if (k === 0 && (trun.flags & BoxParser.TRUN_FLAGS_FIRST_FLAG)) {
							sample_flags = trun.first_sample_flags;
						}
						sample.is_sync = ((sample_flags >> 16 & 0x1) ? false : true);
						sample.is_leading = (sample_flags >> 26 & 0x3);
						sample.depends_on = (sample_flags >> 24 & 0x3);
						sample.is_depended_on = (sample_flags >> 22 & 0x3);
						sample.has_redundancy = (sample_flags >> 20 & 0x3);
						sample.degradation_priority = (sample_flags & 0xFFFF);
						//ISOFile.process_sdtp(traf.sdtp, sample, sample.number_in_traf);
						var bdop = (traf.tfhd.flags & BoxParser.TFHD_FLAG_BASE_DATA_OFFSET) ? true : false;
						var dbim = (traf.tfhd.flags & BoxParser.TFHD_FLAG_DEFAULT_BASE_IS_MOOF) ? true : false;
						var dop = (trun.flags & BoxParser.TRUN_FLAGS_DATA_OFFSET) ? true : false;
						var bdo = 0;
						if (!bdop) {
							if (!dbim) {
								if (j === 0) { // the first track in the movie fragment
									bdo = moof.start; // the position of the first byte of the enclosing Movie Fragment Box
								} else {
									bdo = last_run_position; // end of the data defined by the preceding *track* (irrespective of the track id) fragment in the moof
								}
							} else {
								bdo = moof.start;
							}
						} else {
							bdo = traf.tfhd.base_data_offset;
						}
						if (j === 0 && k === 0) {
							if (dop) {
								sample.offset = bdo + trun.data_offset; // If the data-offset is present, it is relative to the base-data-offset established in the track fragment header
							} else {
								sample.offset = bdo; // the data for this run starts the base-data-offset defined by the track fragment header
							}
						} else {
							sample.offset = last_run_position; // this run starts immediately after the data of the previous run
						}
						last_run_position = sample.offset + sample.size;
						if (traf.sbgps.length > 0 || traf.sgpds.length > 0 ||
							trak.mdia.minf.stbl.sbgps.length > 0 || trak.mdia.minf.stbl.sgpds.length > 0) {
							ISOFile.setSampleGroupProperties(trak, sample, sample.number_in_traf, traf.sample_groups_info);
						}
					}
				}
				if (traf.subs) {
					trak.has_fragment_subsamples = true;
					var sample_index = traf.first_sample_index;
					for (j = 0; j < traf.subs.entries.length; j++) {
						sample_index += traf.subs.entries[j].sample_delta;
						sample = trak.samples[sample_index-1];
						sample.subsamples = traf.subs.entries[j].subsamples;
					}					
				}
			}
		}
	}	
}

/* Try to get sample data for a given sample:
   returns null if not found
   returns the same sample if already requested
 */
ISOFile.prototype.getSample = function(trak, sampleNum) {	
	var buffer;
	var sample = trak.samples[sampleNum];
	
	if (!this.moov) {
		return null;
	}

	if (!sample.data) {
		/* Not yet fetched */
		sample.data = new Uint8Array(sample.size);
		sample.alreadyRead = 0;
		this.samplesDataSize += sample.size;
		Log.debug("ISOFile", "Allocating sample #"+sampleNum+" on track #"+trak.tkhd.track_id+" of size "+sample.size+" (total: "+this.samplesDataSize+")");
	} else if (sample.alreadyRead == sample.size) {
		/* Already fetched entirely */
		return sample;
	}

	/* The sample has only been partially fetched, we need to check in all buffers */
	while(true) {
		var index =	this.stream.findPosition(true, sample.offset + sample.alreadyRead, false);
		if (index > -1) {
			buffer = this.stream.buffers[index];
			var lengthAfterStart = buffer.byteLength - (sample.offset + sample.alreadyRead - buffer.fileStart);
			if (sample.size - sample.alreadyRead <= lengthAfterStart) {
				/* the (rest of the) sample is entirely contained in this buffer */

				Log.debug("ISOFile","Getting sample #"+sampleNum+" data (alreadyRead: "+sample.alreadyRead+" offset: "+
					(sample.offset+sample.alreadyRead - buffer.fileStart)+" read size: "+(sample.size - sample.alreadyRead)+" full size: "+sample.size+")");

				DataStream.memcpy(sample.data.buffer, sample.alreadyRead,
				                  buffer, sample.offset+sample.alreadyRead - buffer.fileStart, sample.size - sample.alreadyRead);

				/* update the number of bytes used in this buffer and check if it needs to be removed */
				buffer.usedBytes += sample.size - sample.alreadyRead;
				this.stream.logBufferLevel();

				sample.alreadyRead = sample.size;

				return sample;
			} else {
				/* the sample does not end in this buffer */

				if (lengthAfterStart === 0) return null;

				Log.debug("ISOFile","Getting sample #"+sampleNum+" partial data (alreadyRead: "+sample.alreadyRead+" offset: "+
					(sample.offset+sample.alreadyRead - buffer.fileStart)+" read size: "+lengthAfterStart+" full size: "+sample.size+")");

				DataStream.memcpy(sample.data.buffer, sample.alreadyRead,
				                  buffer, sample.offset+sample.alreadyRead - buffer.fileStart, lengthAfterStart);
				sample.alreadyRead += lengthAfterStart;

				/* update the number of bytes used in this buffer and check if it needs to be removed */
				buffer.usedBytes += lengthAfterStart;
				this.stream.logBufferLevel();

				/* keep looking in the next buffer */
			}
		} else {
			return null;
		}
	}
}

/* Release the memory used to store the data of the sample */
ISOFile.prototype.releaseSample = function(trak, sampleNum) {	
	var sample = trak.samples[sampleNum];
	if (sample.data) {
		this.samplesDataSize -= sample.size;
		sample.data = null;
		sample.alreadyRead = 0;
		return sample.size;
	} else {
		return 0;
	}
}

ISOFile.prototype.getAllocatedSampleDataSize = function() {
	return this.samplesDataSize;
}

/* Builds the MIME Type 'codecs' sub-parameters for the whole file */
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

/* Helper function */
ISOFile.prototype.getTrexById = function(id) {	
	var i;
	if (!this.moov || !this.moov.mvex) return null;
	for (i = 0; i < this.moov.mvex.trexs.length; i++) {
		var trex = this.moov.mvex.trexs[i];
		if (trex.track_id == id) return trex;
	}
	return null;
}

/* Helper function */
ISOFile.prototype.getTrackById = function(id) {
	if (this.moov === undefined) {
		return null;
	}
	for (var j = 0; j < this.moov.traks.length; j++) {
		var trak = this.moov.traks[j];
		if (trak.tkhd.track_id == id) return trak;
	}
	return null;
}

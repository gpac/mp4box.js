var OSisLittleEndian=false;

function ReferencePictureList(list, rpls) {
	this.list = list;
	this.rpls = rpls;
	this.pics = [];
}
ReferencePictureList.prototype.set_reference_to_library_enable_flag = function(flag) {
	this.reference_to_library_enable_flag = flag;
};
ReferencePictureList.prototype.add = function(pic) {
	this.pics.push(pic);
};
ReferencePictureList.prototype.toString = function() {
	var ret = "{";
	if (this.hasOwnProperty("reference_to_library_enable_flag")) 
		ret += "reference_to_library_enable_flag: " + this.reference_to_library_enable_flag;
	this.pics.forEach(function write(e) {
		var str = JSON.stringify(e).replace(/\"/g, "");
		ret += (ret.length > 3 ? ", " : "") + str;
	});
	ret += "}";
	return ret;
};

var reference_picture_list_formatter = function(obj) {
	var ret = [];
	if (obj.hasOwnProperty("list") && Array.isArray(obj.list)) {
		obj.list.forEach(function write(e) {
			ret.push(e.toString());
		});
	}
	return ret.join(", ");
};


function WeightQuantMatrix( buffer ) {
	this.WeightQuantMatrix4x4 = [];
	this.WeightQuantMatrix8x8 = [];

	for (var sizeId=0; sizeId < 2; sizeId++) {
		var this_size=[];
		var WQMSize = 1<<(sizeId+2);
		for (var i=0; i<WQMSize; i++) {
			var iVal=[];
			for (var j=0; j<WQMSize; j++) 
				iVal.push(buffer.getUE());
			this_size.push(iVal);
		}
		if (sizeId==0)
			WeightQuantMatrix4x4 = this_size;
		else 
			WeightQuantMatrix8x8 = this_size;
	}
}
WeightQuantMatrix.prototype.toString = function() {
	var str="";
	if (this.WeightQuantMatrix4x4.length)
		str+="4x4: " + JSON.stringify(this.WeightQuantMatrix4x4);
	if (this.WeightQuantMatrix8x8.length)
		str += (str.length>2 ? ",\n" : "") + "8x8: " + JSON.stringify(this.WeightQuantMatrix8x8);
	return str;
};


BoxParser.createBoxCtor("av3c", function(stream) {

	var BitBuffer = {
		_buffer: [],
		_buffer_size: 0,
	
		load: function(data, read_only) {
			this._buffer = data;
			this._buffer_size = data.length;
			this._big_endian = true;
			this._read_error = this._write_error = false;
	
			this._state={};
			this._state.read_only = read_only | false;
			this._state.rbyte = 0;
			this._state.rbit = 0;
			this._state.end = this._state.wbyte = this._buffer_size;
			this._state.wbit = 0;
		},
		getBit: function() {
			//! Read the next bit and advance the read pointer.
			if (this._read_error || this.endOfRead()) {
				this._read_error = true;
				return 0;
			}
			var bit = (this._buffer[this._state.rbyte] >> (this._big_endian ? (7 - this._state.rbit) : this._state.rbit)) & 0x01;
			if (++this._state.rbit > 7) {
				this._state.rbyte++;
				this._state.rbit = 0;
			}
			return bit;
		},
		peekBit: function() {
			//! Read the next bit but don't advance the read pointer.
			if (this._read_error || this.endOfRead()) {
				this._read_error = true;
				return 0;
			}
			var bit = (this._buffer[this._state.rbyte] >> (this._big_endian ? (7 - this._state.rbit) : this._state.rbit)) & 0x01;
			return bit;
		},
		endOfRead: function() {
			return this._state.rbyte == this._state.wbyte && this._state.rbit == this._state.wbit;
		},
		getBool: function() {
			return this.getBit() != 0;
		},
		rdb: function(bytes) {
			var i, res, ff=0xFFFFFFFFFFFFFFFF;
			if (this._read_error)
				return ff;
			if (this._state.rbit==0) {
				// Read buffer is byte aligned. Most common case.
				if (this._state.rbyte + bytes > this._state.wbyte) {
					// Not enough bytes to read.
					this._read_error = true;
					return ff;
				}
				else {
					for (res=0, i=0; i<bytes; i++)
						res = (res << 8) + this._buffer[this._state.rbyte+i];
					this._state.rbyte += bytes;
					return res;
				}
			}
			else {
				// Read buffer is not byte aligned, use an intermediate aligned buffer.
				if (this.currentReadBitOffset() + (8 * bytes) > this.currentWriteBitOffset()) {
					// Not enough bytes to read.
					this._read_error = true;
					return ff;
				}
				else {
					for (res=0, i=0; i<bytes; i++) {
						if (this._big_endian)
							res = (res << 8) + ((this._buffer[this._state.rbyte] << this._state.rbit) | (this._buffer[this._state.rbyte + 1] >> (8 - this._state.rbit)));
						else
							res = (res << 8) + ((_buffer[_state.rbyte] >> _state.rbit) | (_buffer[_state.rbyte + 1] << (8 - _state.rbit)));
						this._state.rbyte++;
					}
					return res;
				}
			}
		},
		currentReadByteOffset: function() {return this._state.rbyte;},
		currentReadBitOffset: function() {return 8 * this._state.rbyte + this._state.rbit;},
		currentWriteByteOffset: function() {return this._state.wbyte;},
		currentWriteBitOffset: function() {return 8 * this._state.wbyte + this._state.wbit;},
	
		getUint8: function() {
			return this.rdb(1);
		},
	
		getUint16: function() {
			return this._big_endian ? this.GetUInt16BE(this.rdb(2)) : this.GetUInt16LE(this.rdb(2));
		},
		ByteSwap16: function(x) {
			return (x << 8) | (x >> 8);
		},
		CondByteSwap16BE: function(val) {
			return OSisLittleEndian ? this.ByteSwap16(val) : val;
		},
		CondByteSwap16LE: function(val) {
			return OSisLittleEndian ? val : this.ByteSwap16(val);
		},
		GetUInt16BE: function(val) {
			return this.CondByteSwap16BE(val);
		},
		GetUInt16LE: function(val) {
			return this.CondByteSwap16LE(val);
		},
		
		getUint32: function() {
			return this._big_endian ? this.GetUInt32BE(this.rdb(4)) : this.GetUInt32LE(this.rdb(4));
		},
		ByteSwap32: function(x) {
			return (x << 24) | ((x << 8) & 0x00FF0000) | ((x >> 8) & 0x0000FF00) | (x >> 24);
		},
		CondByteSwap32BE: function(val) {
			return OSisLittleEndian ? this.ByteSwap32(val) : val;
		},
		CondByteSwap32LE: function(val) {
			return OSisLittleEndian ? val : this.ByteSwap32(val);
		},
		GetUInt32BE: function(val) {
			return this.CondByteSwap32BE(val);
		},
		GetUInt32LE: function(val) {
			return this.CondByteSwap32LE(val);
		},
	
		getBits: function(bits) {
			// No read if read error is already set or not enough bits to read.
			if (this._read_error || this.currentReadBitOffset() + bits > this.currentWriteBitOffset()) {
				this._read_error = true;
				return 0;
			}
			var val = 0;
			if (this._big_endian) {
				// Read leading bits up to byte boundary
				while (bits > 0 && this._state.rbit != 0) {
					val = (val << 1) | this.getBit();
					--bits;
				}
	
				// Read complete bytes
				while (bits > 7) {
					val = (val << 8) | this._buffer[this._state.rbyte++];
					bits -= 8;
				}
	
				// Read trailing bits
				while (bits > 0) {
					val = (val << 1) | this.getBit();
					--bits;
				}
			}
			else {
				// Little endian decoding
				var shift = 0;
	
				// Read leading bits up to byte boundary
				while (bits > 0 && this._state.rbit != 0) {
					val |= (this.getBit() << shift);
					--bits;
					shift++;
				}
	
				// Read complete bytes
				while (bits > 7) {
					val |= this._buffer[this._state.rbyte++] << shift;
					bits -= 8;
					shift += 8;
				}
	
				// Read trailing bits
				while (bits > 0) {
					val |= (this.getBit() << shift);
					--bits;
					shift++;
				}
			}
			return (val);
		},
		skipBits: function(bits) {
			if (this._read_error) {
				// Can't skip bits and bytes if read error is already set.
				return false;
			}
			var rpos = 8 * this._state.rbyte + this._state.rbit + bits;
			var wpos = 8 * this._state.wbyte + this._state.wbit;
			if (rpos > wpos) {
				this._state.rbyte = this._state.wbyte;
				this._state.rbit = this._state.wbit;
				this._read_error = true;
				return false;
			}
			else {
				this._state.rbyte = rpos >> 3;
				this._state.rbit = rpos & 7;
				return true;
			}
		},
	
		getUE: function() {
			// read in an unsigned Exp-Golomb code;
	
			if (this.getBit() == 1)
				return 0;
			else {
				var zero_count=1;
				while (this.peekBit() == 0) {
					this.getBit();
					zero_count++;
				}
				var tmp_value = this.getBits(zero_count+1);
				return tmp_value - 1;
			}
		}
	};

	var i, j, tmp_byte, sequence_header_length;
	var MAIN_8 = 0x20, MAIN_10 = 0x22, HIGH_8 = 0x30, HIGH_10 = 0x32;

	var binForm = function (value, bits) {
		var _i, res = "b";
		for (_i=bits; _i>0; _i--)
			res += (value & (1 << (_i-1)) ? "1" : "0");
		return res;
	};
	var se2value = function (codeNum) {
		return ( Math.pow(-1, codeNum+1) * Math.ceil(codeNum/2));
	};
	this.configurationVersion = stream.readUint8();
	sequence_header_length = stream.readUint16();

	var buf=[];
	for (i=0; i<sequence_header_length; i++) {
		buf.push(stream.readUint8());
	}
	BitBuffer.load(buf, false);

	tmp_byte = BitBuffer.getUint32();   // video_sequence_start_code
	this.profile_id = BitBuffer.getUint8();
	this.level_id = BitBuffer.getUint8();
	this.progressive_sequence = BitBuffer.getBit();
	this.field_coded_sequence = BitBuffer.getBit();
	this.library_stream_flag = BitBuffer.getBit();
	if (!this.library_stream_flag) {
		this.library_picture_enable_flag = BitBuffer.getBit();
		if (this.library_picture_enable_flag)
			this.duplicate_sequence_number_flag = BitBuffer.getBit();
	}
	BitBuffer.skipBits(1);  // marker_bit

	this.horizontal_size = BitBuffer.getBits(14);
	BitBuffer.skipBits(1);  // marker_bit

	this.vertical_size = BitBuffer.getBits(14);
	this.chroma_format = binForm(BitBuffer.getBits(2), 2);
	this.sample_precision = binForm(BitBuffer.getBits(3), 3);
	
	if (this.profile_id == MAIN_10 || this.profile_id == HIGH_10)
		this.encoding_precision = binForm(BitBuffer.getBits(3), 3);
	BitBuffer.skipBits(1);  // marker_bit

	this.aspect_ratio = binForm(BitBuffer.getBits(4), 4);
	this.frame_rate_code = binForm(BitBuffer.getBits(4), 4);
	BitBuffer.skipBits(1);  // marker_bit

	this.bit_rate_lower = BitBuffer.getBits(18);
	BitBuffer.skipBits(1);  // marker_bit

	this.bit_rate_upper = BitBuffer.getBits(12);
	this.low_delay = BitBuffer.getBit();
	this.temporal_id_enable_flag = BitBuffer.getBit();
	BitBuffer.skipBits(1);  // marker_bit

	this.bbv_buffer_size = BitBuffer.getBits(18);
	BitBuffer.skipBits(1);  // marker_bit

	this.max_dpb_minus1 = BitBuffer.getBits(4);
	this.rpl1_index_exist_flag = BitBuffer.getBit();
	this.rpl1_same_as_rpl0_flag = BitBuffer.getBit();
	BitBuffer.skipBits(1);  // marker_bit

	var reference_picture_list = function(list, rpls) {
		var i, this_set = new ReferencePictureList(list, rpls);
		if (this.library_picture_enable_flag)
			this_set.set_reference_to_library_enable_flag(BitBuffer.getBit());
		var num_of_ref_pic = BitBuffer.getUE();
		for (i=0; i<num_of_ref_pic; i++) {
			var this_pic = {}, LibraryIndexFlag = false;	
			if (this.reference_to_library_enable_flag)
				LibraryIndexFlag = this_pic.library_index_flag = BitBuffer.getBit();
			if (LibraryIndexFlag)
				this_pic.referenced_library_picture_index = BitBuffer.getUE();
			else {
				this_pic.abs_delta_doi = BitBuffer.getUE();
				if (this_pic.abs_delta_doi > 0)
					this_pic.sign_delta_doi = BitBuffer.getBit();
			}
			this_set.add(this_pic);
		}
		return this_set;
	};

	this.num_ref_pic_list_set0 = BitBuffer.getUE();
	this.rpl0={};
	if (this.num_ref_pic_list_set0 > 0) {
		this.rpl0.list=[];
		this.rpl0.toString = reference_picture_list_formatter; 
		for (j=0; j<this.num_ref_pic_list_set0; j++)
			this.rpl0.list.push(reference_picture_list(0, j));
	}
	if (!this.rpl1_same_as_rpl0_flag) {
		this.num_ref_pic_list_set1 = BitBuffer.getUE();
		this.rpl1={};
		if (this.num_ref_pic_list_set1 > 0) {
			this.rpl1.list=[];
			this.rpl1.toString = reference_picture_list_formatter; 
			for (j=0; j<this.num_ref_pic_list_set1; j++)
				this.rpl1.list.push(reference_picture_list(1, j));
		}
	}

	this.num_ref_default_active_minus1_0 = BitBuffer.getUE();
	this.num_ref_default_active_minus1_1 = BitBuffer.getUE();
	this.log2_lcu_size_minus2 = BitBuffer.getBits(3);
	this.log2_min_cu_size_minus2 = BitBuffer.getBits(2);
	this.log2_max_part_ratio_minus2 = BitBuffer.getBits(2);
	this.max_split_times_minus6 = BitBuffer.getBits(3);
	this.log2_min_qt_size_minus2 = BitBuffer.getBits(3);
	this.log2_max_bt_size_minus2 = BitBuffer.getBits(3);
	this.log2_max_eqt_size_minus3 = BitBuffer.getBits(2);
	BitBuffer.skipBits(1);  // marker_bit

	this.weight_quant_enable_flag = BitBuffer.getBit();
	if (this.weight_quant_enable_flag) {
		this.load_seq_weight_quant_data_flag = BitBuffer.getBit();
		if (this.load_seq_weight_quant_data_flag) 
			this.weight_quant_matrix = new WeightQuantMatrix(BitBuffer);
	}

	this.st_enable_flag = BitBuffer.getBit();
	this.sao_enable_flag = BitBuffer.getBit();
	this.alf_enable_flag = BitBuffer.getBit();
	this.affine_enable_flag = BitBuffer.getBit();
	this.smvd_enable_flag = BitBuffer.getBit();
	this.ipcm_enable_flag = BitBuffer.getBit();
	this.amvr_enable_flag = BitBuffer.getBit();
	this.num_of_hmvp_cand = BitBuffer.getBits(4);
	this.umve_enable_flag = BitBuffer.getBit();
	this.st_enable_flag = BitBuffer.getBit();
	this.st_enable_flag = BitBuffer.getBit();
	if (this.num_of_hmvp_cand != 0 && this.amvr_enable_flag)
		this.emvr_enable_flag = BitBuffer.getBit();
	this.intra_pf_enable_flag = BitBuffer.getBit();
	this.tscpm_enable_flag = BitBuffer.getBit();
	BitBuffer.skipBits(1);  // marker_bit

	this.dt_enable_flag = BitBuffer.getBit();
	if (this.dt_enable_flag)
		this.log2_max_dt_size_minus4 = BitBuffer.getBits(2);
	this.pbt_enable_flag = BitBuffer.getBit();	

	if (this.profile_id == MAIN_10 || this.profile_id == HIGH_10) {
		this.pmc_enable_flag = BitBuffer.getBit();
		this.iip_enable_flag = BitBuffer.getBit();
		this.sawp_enable_flag = BitBuffer.getBit();
		if (this.affine_enable_flag)
			this.asr_enable_flag = BitBuffer.getBit();
		this.awp_enable_flag = BitBuffer.getBit();
		this.etmvp_mvap_enable_flag = BitBuffer.getBit();
		this.dmvr_enable_flag = BitBuffer.getBit();
		this.bio_enable_flag = BitBuffer.getBit();
		this.bgc_enable_flag = BitBuffer.getBit();
		this.inter_pf_enable_flag = BitBuffer.getBit();
		this.inter_pfc_enable_flag = BitBuffer.getBit();
		this.obmc_enable_flag = BitBuffer.getBit();

		this.sbt_enable_flag = BitBuffer.getBit();
		this.ist_enable_flag = BitBuffer.getBit();

		this.esao_enable_flag = BitBuffer.getBit();
		this.ccsao_enable_flag = BitBuffer.getBit();
		if (this.alf_enable_flag)
			this.ealf_enable_flag = BitBuffer.getBit();
		this.ibc_enable_flag = BitBuffer.getBit();
		BitBuffer.skipBits(1);  // marker_bit

		this.isc_enable_flag = BitBuffer.getBit();
		if (this.ibc_enable_flag || this.isc_enable_flag)
			this.num_of_intra_hmvp_cand = BitBuffer.getBits(4);
		this.fimc_enable_flag = BitBuffer.getBit();
		this.nn_tools_set_hook = BitBuffer.getBits(8);
		if (this.nn_tools_set_hook & 0x01)
			this.num_of_nn_filter_minus1 = BitBuffer.getUE();
		BitBuffer.skipBits(1);  // marker_bit
	}
	if (this.low_delay == 0)
		this.output_reorder_delay = BitBuffer.getBits(5);
	this.cross_patch_loop_filter_enable_flag = BitBuffer.getBit();
	this.ref_colocated_patch_flag = BitBuffer.getBit();
	this.stable_patch_flag = BitBuffer.getBit();
	if (this.stable_patch_flag) {
		this.uniform_patch_flag = BitBuffer.getBit();
		if (this.uniform_patch_flag) {
			BitBuffer.skipBits(1);  // marker_bit
			this.patch_width_minus1 = BitBuffer.getUE();
			this.patch_height_minus1 = BitBuffer.getUE();
		}
	}
	BitBuffer.skipBits(2);  // reserved bits


	this.library_dependency_idc = binForm(stream.readUint8(), 2);
});


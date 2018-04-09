if (typeof exports !== 'undefined') {
	var GolombBitStream = require('./golomb.js');
	var NALUStream = require('./naluframe.js');
}

var HEVCStream = function(u8data) {
	// Parsed PS
	this.VPS    = {};
	this.VPS.ptl= {};
	this.SPS    = {};
	this.SPS.ptl= {};
	this.PPS    = null;
	// Other NALU not parsed
	this.data   = null;
	this.width  = 0;
	this.height = 0;
	if (u8data) {
		var i;
		this.frames = NALUStream.parseFrames(u8data, HEVCStream);
		for (i = 0; i < frames.length; i++) {
			
		}
	}
	this.nalu_length = 4;
}
HEVCStream.VPS_NALU_TYPE = 32;
HEVCStream.SPS_NALU_TYPE = 33;
HEVCStream.PPS_NALU_TYPE = 34;

/* Writes the VPS for this stream
   Returns an ArrayBuffer with start code and emulation prevention bytes */
HEVCStream.prototype.writeVPS = function () {
	var ab = new ArrayBuffer(100);
	var bs = new GolombBitStream(ab);
	var nbBits = 0;

	/* NALU Header */
	bs.dataView.writeUnsigned(0, 1); /* forbidden zero */
	bs.dataView.writeUnsigned(HEVCStream.VPS_NALU_TYPE, 6); /*nal_unit_type*/
	bs.dataView.writeUnsigned(0, 6); /* nuh_layer_id */
	bs.dataView.writeUnsigned(1, 3); /* nuh_temporal_id_plus1 */
	nbBits+= 16;

	/* VPS payload */
	bs.dataView.writeUnsigned(0, 4); /* vps_video_parameter_set_id */
	bs.dataView.writeUnsigned(1, 1); /* vps_base_layer_internal_flag */
	bs.dataView.writeUnsigned(1, 1); /* vps_base_layer_available_flag */
	bs.dataView.writeUnsigned(0, 6); /* vps_max_layers_minus1 */
	bs.dataView.writeUnsigned(0, 3); /* vps_max_sub_layers_minus1 */
	bs.dataView.writeUnsigned(0, 1); /* vps_temporal_id_nesting_flag */
	bs.dataView.writeUnsigned(0xffff, 16); /* vps_reserved_0xffff_16bits */
	nbBits+=32;

	nbBits+=this.writePTL(bs, this.VPS.ptl);

	bs.dataView.writeUnsigned(0, 1); /* vps_sub_layer_ordering_info_present_flag */
	nbBits++;
	nbBits+=bs.numToExpGolomb(0);	/* vps_max_dec_pic_buffering_minus1 */
	nbBits+=bs.numToExpGolomb(0);	/* vps_max_num_reorder_pics */
	nbBits+=bs.numToExpGolomb(0);	/* vps_max_latency_increase_plus1 */
	bs.dataView.writeUnsigned(0, 6); /* vps_max_layer_id */
	nbBits+=6;
	nbBits+=bs.numToExpGolomb(0);	/* vps_num_layer_sets_minus1 */
	bs.dataView.writeUnsigned(0, 1); /* vps_timing_info_present_flag */
	bs.dataView.writeUnsigned(0, 1); /* vps_extension_flag */
	nbBits+=2;
	nbBits = NALUStream.writeTrailingBits(bs, nbBits);

	var nbBytes = nbBits/8;
	ab = ab.slice(0,nbBytes);	
	var u8 = new Uint8Array(ab);
	u8 = NALUStream.addEmulationBytes(u8);
	u8 = NALUStream.addStartCode(u8);
	return u8.buffer;
}

/* Writes a profile, tier and level structure used in VPS/SPS in the given GolombBitstream 
   Returns the number of bits written
*/
HEVCStream.prototype.writePTL = function (bs, ptl) {
	var nbBits = 0;

	/* profile_tier_level */
	bs.dataView.writeUnsigned(ptl.general_profile_space, 2);
	bs.dataView.writeUnsigned(ptl.general_tier_flag, 1);
	bs.dataView.writeUnsigned(ptl.general_profile_idc, 5);
	bs.dataView.writeUnsigned(ptl.general_profile_compatibility_flag, 32);
	bs.dataView.writeUnsigned(ptl.general_progressive_source_flag, 1);
	bs.dataView.writeUnsigned(ptl.general_interlaced_source_flag, 1);
	bs.dataView.writeUnsigned(ptl.general_non_packed_constraint_flag, 1);
	bs.dataView.writeUnsigned(ptl.general_frame_only_constraint_flag, 1);
	bs.dataView.writeUnsigned(0, 43);
	bs.dataView.writeUnsigned(0, 1);
	nbBits+= 88;

	bs.dataView.writeUnsigned(ptl.general_level_idc, 8); 
	nbBits+= 8;

	/* sps_max_sub_layers_minus1 = 0; */
	return nbBits;
}

/* Writes the SPS for this stream
   Returns an ArrayBuffer with start code and emulation prevention bytes */
HEVCStream.prototype.writeSPS = function () {
	var ab = new ArrayBuffer(100);
	var bs = new GolombBitStream(ab);
	var nbBits = 0;

	/* NALU Header */
	bs.dataView.writeUnsigned(0, 1); /* forbidden zero */
	bs.dataView.writeUnsigned(HEVCStream.SPS_NALU_TYPE, 6); /*nal_unit_type*/
	bs.dataView.writeUnsigned(0, 6); /* nuh_layer_id */
	bs.dataView.writeUnsigned(1, 3); /* nuh_temporal_id_plus1 */
	nbBits+= 16;

	/* SPS payload */
	bs.dataView.writeUnsigned(0, 4); /* sps_video_parameter_set_id */
	bs.dataView.writeUnsigned(0, 3); /* sps_max_sub_layers_minus1 */
	bs.dataView.writeUnsigned(0, 1); /* sps_temporal_id_nesting_flag */
	nbBits+= 8;
	
	nbBits+=this.writePTL(bs, this.SPS.ptl);

	nbBits+=bs.numToExpGolomb(0);	/* sps_seq_parameter_set_id */
	nbBits+=bs.numToExpGolomb(this.SPS.chroma_format_idc); /* chroma_format_idc */
	if (this.SPS.chroma_format_idc == 3) {
		bs.dataView.writeUnsigned(0, 1); /* separate_colour_plane_flag  */
		nbBits++;
	}
	nbBits+=bs.numToExpGolomb(this.SPS.pic_width_in_luma_samples);	/* pic_width_in_luma_samples */
	nbBits+=bs.numToExpGolomb(this.SPS.pic_height_in_luma_samples);	/* pic_height_in_luma_samples */
	bs.dataView.writeUnsigned(0, 1); /*conformance_window_flag*/
	nbBits++;
	nbBits+=bs.numToExpGolomb(this.SPS.bit_depth_luma_minus8);	/* bit_depth_luma_minus8 */
	nbBits+=bs.numToExpGolomb(this.SPS.bit_depth_chroma_minus8);	/* bit_depth_chroma_minus8 */
	nbBits+=bs.numToExpGolomb(4);	/* log2_max_pic_order_cnt_lsb_minus4 */
	bs.dataView.writeUnsigned(0, 1); /*sps_sub_layer_ordering_info_present_flag*/
	nbBits++;
	nbBits+=bs.numToExpGolomb(0);	/* sps_max_dec_pic_buffering_minus1 */
	nbBits+=bs.numToExpGolomb(0);	/* sps_max_num_reorder_pics */
	nbBits+=bs.numToExpGolomb(0);	/* sps_max_latency_increase_plus1 */
	nbBits+=bs.numToExpGolomb(this.SPS.log2_min_luma_coding_block_size_minus3);	/* log2_min_luma_coding_block_size_minus3 */
	nbBits+=bs.numToExpGolomb(this.SPS.log2_diff_max_min_luma_coding_block_size);	/* log2_diff_max_min_luma_coding_block_size */
	nbBits+=bs.numToExpGolomb(this.SPS.log2_min_transform_block_size_minus2);	/* log2_min_luma_transform_block_size_minus2 */
	nbBits+=bs.numToExpGolomb(this.SPS.log2_diff_max_min_transform_block_size);	/* log2_diff_max_min_luma_transform_block_size */
	nbBits+=bs.numToExpGolomb(this.SPS.max_transform_hierarchy_depth_inter);	/* max_transform_hierarchy_depth_inter */
	nbBits+=bs.numToExpGolomb(this.SPS.max_transform_hierarchy_depth_intra);	/* max_transform_hierarchy_depth_intra */
	bs.dataView.writeUnsigned(0, 1); /*scaling_list_enabled_flag */
	bs.dataView.writeUnsigned(1, 1); /*amp_enabled_flag */
	bs.dataView.writeUnsigned(this.SPS.sample_adaptive_offset_enabled_flag, 1); /*sample_adaptive_offset_enabled_flag */
	bs.dataView.writeUnsigned(this.SPS.pcm_enabled_flag, 1); /*pcm_enabled_flag */
	nbBits+= 4;
	if (this.SPS.pcm_enabled_flag) {
		bs.dataView.writeUnsigned(this.SPS.pcm_sample_bit_depth_luma_minus1, 4); /*pcm_sample_bit_depth_luma_minus1*/
		nbBits += 4;
		bs.dataView.writeUnsigned(this.SPS.pcm_sample_bit_depth_chroma_minus1, 4); /*pcm_sample_bit_depth_chroma_minus1*/
		nbBits += 4;
		nbBits+=bs.numToExpGolomb(this.SPS.log2_min_pcm_luma_coding_block_size_minus3);	/* log2_min_pcm_luma_coding_block_size_minus3 */
		nbBits+=bs.numToExpGolomb(this.SPS.log2_diff_max_min_pcm_luma_coding_block_size);	/* log2_diff_max_min_pcm_luma_coding_block_size */
		bs.dataView.writeUnsigned(this.SPS.pcm_loop_filter_disabled_flag, 4); /*pcm_loop_filter_disabled_flag*/
		nbBits ++;
	}

	nbBits+=bs.numToExpGolomb(0);	/* num_short_term_ref_pic_sets */
	bs.dataView.writeUnsigned(0, 1); /*long_term_ref_pics_present_flag */
	bs.dataView.writeUnsigned(1, 1); /*sps_temporal_mvp_enabled_flag */
	bs.dataView.writeUnsigned(this.SPS.strong_intra_smoothing_enabled_flag, 1); /*strong_intra_smoothing_enabled_flag */
	bs.dataView.writeUnsigned(0, 1); /*vui_parameters_present_flag */
	bs.dataView.writeUnsigned(this.SPS.sps_extension_present_flag, 1); /*sps_extension_present_flag */
	nbBits+=4;

	if (this.SPS.sps_extension_present_flag) {
		bs.dataView.writeUnsigned(this.SPS.sps_range_extension_flag, 1); /*sps_range_extension_flag */
		bs.dataView.writeUnsigned(this.SPS.sps_extension_7bits, 7); /*sps_range_extension_flag */
		nbBits+=8;
	}

	if (this.SPS.sps_range_extension_flag) {
		bs.dataView.writeUnsigned(this.SPS.transform_skip_rotation_enabled_flag, 1); /* transform_skip_rotation_enabled_flag */
		bs.dataView.writeUnsigned(this.SPS.transform_skip_rotation_enabled_flag, 1);
		bs.dataView.writeUnsigned(this.SPS.transform_skip_context_enabled_flag, 1);
		bs.dataView.writeUnsigned(this.SPS.implicit_rdpcm_enabled_flag, 1);
		bs.dataView.writeUnsigned(this.SPS.explicit_rdpcm_enabled_flag, 1);
		bs.dataView.writeUnsigned(this.SPS.extended_precision_processing_flag, 1);
		bs.dataView.writeUnsigned(this.SPS.intra_smoothing_disabled_flag, 1);
		bs.dataView.writeUnsigned(this.SPS.high_precision_offsets_enabled_flag, 1);
		bs.dataView.writeUnsigned(this.SPS.persistent_rice_adaptation_enabled_flag, 1);
		bs.dataView.writeUnsigned(this.SPS.cabac_bypass_alignment_enabled_flag, 1);
		nbBits+=10;
	}	
	nbBits = NALUStream.writeTrailingBits(bs, nbBits);

	var nbBytes = nbBits/8;
	ab = ab.slice(0,nbBytes);	
	var u8 = new Uint8Array(ab);
	u8 = NALUStream.addEmulationBytes(u8);
	u8 = NALUStream.addStartCode(u8);
	return u8.buffer;
}

/* Reads profile, tier and level structure from the given GolombBitstream */
HEVCStream.prototype.readPTL = function(bs, ptl, sps_max_sub_layers_minus1) {
	ptl.general_profile_space = bitStreamRead.dataView.getUnsigned(2);
	ptl.general_tier_flag = bitStreamRead.dataView.getUnsigned(1);
	ptl.general_profile_idc = bitStreamRead.dataView.getUnsigned(5);
	ptl.general_profile_compatibility_flag = bitStreamRead.dataView.getUnsigned(32);
	ptl.general_progressive_source_flag = bitStreamRead.dataView.getUnsigned(1);
	ptl.general_interlaced_source_flag = bitStreamRead.dataView.getUnsigned(1);
	ptl.general_non_packed_constraint_flag = bitStreamRead.dataView.getUnsigned(1);
	ptl.general_frame_only_constraint_flag = bitStreamRead.dataView.getUnsigned(1);
	// if( general_profile_idc = = 4 | | ...
	bitStreamRead.dataView.skip(5);
	bitStreamRead.dataView.getUnsigned(3);
	// if( ( general_profile_idc >= 1 && ...
	bitStreamRead.dataView.getUnsigned(1);
	// general_level_idc u(8)
	ptl.general_level_idc = bitStreamRead.dataView.getUnsigned(8);

	var sub_layer_profile_present_flag = [];
	var sub_layer_level_present_flag = [];
	for (i = 0; i < sps_max_sub_layers_minus1; i++) {
		// sub_layer_profile_present_flag[i] u(1)
		sub_layer_profile_present_flag[i] = bitStreamRead.dataView.getUnsigned(1);
		// sub_layer_level_present_flag[i] u(1)
		sub_layer_level_present_flag[i] = bitStreamRead.dataView.getUnsigned(1);
	}

	if (sps_max_sub_layers_minus1 > 0) {
		for (i = sps_max_sub_layers_minus1; i < 8; i++) {
			// reserved_zero_2bits[i] u(2)
			bitStreamRead.dataView.getUnsigned(2);		
		}
	}

	for (i = 0; i < sps_max_sub_layers_minus1; i++ ) {
		if (sub_layer_profile_present_flag[i]) {
			/* sub_layer_profile_space[i] u(2), sub_layer_tier_flag[i] u(1),
			sub_layer_profile_idc[i] u(5), sub_layer_profile_compatibility_flag[i] u(32),
			sub_layer_progressive_source_flag[i] u(1), sub_layer_interlaced_source_flag[i] u(1),
			sub_layer_non_packed_constraint_flag[i] u(1), sub_layer_frame_only_constraint_flag[i] u(1) */
			bitStreamRead.dataView.skip(5);
			bitStreamRead.dataView.getUnsigned(4);
			// if( sub_layer_profile_idc[ i ] = = 4 | | ...
			bitStreamRead.dataView.skip(5);
			bitStreamRead.dataView.getUnsigned(3);
			// if( ( sub_layer_profile_idc[ i ] >= 1 && ...
			bitStreamRead.dataView.getUnsigned(1);
		}

		if (sub_layer_level_present_flag[i]) 
			// sub_layer_level_idc [i] u(8)
			bitStreamRead.dataView.skip(1);
	}
}

/* Reads an SPS NAL Unit with emulation prevention bytes (no start code) from an ArrayBuffer */
HEVCStream.prototype.readSPS = function (nalu) {
	var i, j;
	var parsedNalu = NALUStream.removeEmulationBytes(nalu);
	var bitStreamRead = new GolombBitStream(parsedNalu.buffer);
	/* NALU Header on 16 bits: forbidden_zero_bit f(1), nal_unit_type u(6), 
	nuh_layer_id u(6), nuh_temporal_id_plus1 u(3) */
	bitStreamRead.dataView.getUnsigned(16);
	/* sps_video_parameter_set_id u(4) */
	bitStreamRead.dataView.getUnsigned(4);
	// sps_max_sub_layers_minus1 u(3)
	var sps_max_sub_layers_minus1 = bitStreamRead.dataView.getUnsigned(3);
	// sps_temporal_id_nesting_flag u(1)
	bitStreamRead.dataView.getUnsigned(1);

	this.readPTL(bitStreamRead, this.SPS.ptl, sps_max_sub_layers_minus1);

	this.SPS.sps_seq_parameter_set_id = bitStreamRead.expGolombToNum();
	this.SPS.chroma_format_idc = bitStreamRead.expGolombToNum();

	if (this.SPS.chroma_format_idc === 3) {
		this.SPS.separate_colour_plane_flag = bitStreamRead.dataView.getUnsigned(1);
	}

	this.SPS.pic_width_in_luma_samples = bitStreamRead.expGolombToNum();
	this.SPS.pic_height_in_luma_samples = bitStreamRead.expGolombToNum();

	var conformance_window_flag = bitStreamRead.dataView.getUnsigned(1);		
	if (conformance_window_flag) {
		this.SPS.conf_win_left_offset = bitStreamRead.expGolombToNum();
		this.SPS.conf_win_right_offset = bitStreamRead.expGolombToNum();
		this.SPS.conf_win_top_offset = bitStreamRead.expGolombToNum();
		this.SPS.conf_win_bottom_offset = bitStreamRead.expGolombToNum();
	}

	this.SPS.bit_depth_luma_minus8 = bitStreamRead.expGolombToNum();
	this.SPS.bit_depth_chroma_minus8 = bitStreamRead.expGolombToNum();

	var log2_max_pic_order_cnt_lsb_minus4 = bitStreamRead.expGolombToNum();
	var sps_sub_layer_ordering_info_present_flag = bitStreamRead.dataView.getUnsigned(1);
	for(i = sps_sub_layer_ordering_info_present_flag ? 0 : sps_max_sub_layers_minus1; i <= sps_max_sub_layers_minus1; i++) {
		// sps_max_dec_pic_buffering_minus1[i] ue(v)
		bitStreamRead.expGolombToNum();
		// sps_max_num_reorder_pics[i] ue(v) 
		bitStreamRead.expGolombToNum();
		// sps_max_latency_increase_plus1[i] ue(v)
		bitStreamRead.expGolombToNum();
	}

	this.SPS.log2_min_luma_coding_block_size_minus3 = bitStreamRead.expGolombToNum();
	this.SPS.log2_diff_max_min_luma_coding_block_size = bitStreamRead.expGolombToNum();
	this.SPS.log2_min_transform_block_size_minus2 = bitStreamRead.expGolombToNum();
	this.SPS.log2_diff_max_min_transform_block_size = bitStreamRead.expGolombToNum();
	this.SPS.max_transform_hierarchy_depth_inter = bitStreamRead.expGolombToNum();
	this.SPS.max_transform_hierarchy_depth_intra = bitStreamRead.expGolombToNum();
	
	// scaling_list_enabled_flag u(1)
	var scaling_list_enable_flag = bitStreamRead.dataView.getUnsigned(1);
	if (scaling_list_enable_flag) {
		
		// sps_scaling_list_data_present_flag u(1)
		var sps_scaling_list_data_present_flag = bitStreamRead.dataView.getUnsigned(1);
		if (sps_scaling_list_data_present_flag) {
			
			// *********** scaling_list_data( )
			
			var scaling_list_pred_mode_flag = [];
			var scaling_list_dc_coef_minus8 = [];
			var coefNum;
			for (var sizeId = 0; sizeId < 4; sizeId++) {
				for (var matrixId = 0; matrixId < 6; matrixId += (sizeId === 3) ? 3 : 1) {
					
					// scaling_list_pred_mode_flag[sizeId][matrixId]
					if (scaling_list_pred_mode_flag[sizeId] === undefined)
						scaling_list_pred_mode_flag[sizeId] = [];
					scaling_list_pred_mode_flag[sizeId][matrixId] = bitStreamRead.expGolombToNum();
					
					if (!scaling_list_pred_mode_flag[sizeId][matrixId])
						// scaling_list_pred_matrix_id_delta[sizeId][matrixId] ue(v)
						bitStreamRead.expGolombToNum();
					else {
						coefNum = Math.min(64,(1 << (4+(sizeId << 1))));
						
						if (sizeId > 1)
							// scaling_list_dc_coef_minus8[sizeId − 2][matrixId] se(v)
							bitStreamRead.expGolombToNum();
						for (i = 0; i < coefNum; i++) {
							// scaling_list_delta_coef se(v)
							bitStreamRead.expGolombToNum();
						}
					}
				}
			}

			// *********** scaling_list_data( )
		}
	}

	this.SPS.amp_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
	this.SPS.sample_adaptive_offset_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
	
	this.SPS.pcm_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
	if (this.SPS.pcm_enabled_flag) {
		this.SPS.pcm_sample_bit_depth_luma_minus1 = bitStreamRead.dataView.getUnsigned(4);
		this.SPS.pcm_sample_bit_depth_chroma_minus1 = bitStreamRead.dataView.getUnsigned(4);
		this.SPS.log2_min_pcm_luma_coding_block_size_minus3 = bitStreamRead.expGolombToNum();
		this.SPS.log2_diff_max_min_pcm_luma_coding_block_size = bitStreamRead.expGolombToNum();
		this.SPS.pcm_loop_filter_disabled_flag = bitStreamRead.dataView.getUnsigned(1);
	}
	
	var num_short_term_ref_pic_sets = bitStreamRead.expGolombToNum();
	var inter_ref_pic_set_prediction_flag;
	var num_negative_pics = [];
	var num_positive_pics = [];
	var delta_poc = [];
			
	for (i = 0; i < num_short_term_ref_pic_sets; i++) {
		//*********** st_ref_pic_set(stRpsIdx) stRpsIdx = i
		inter_ref_pic_set_prediction_flag = 0;
		if (i) {
			inter_ref_pic_set_prediction_flag = bitStreamRead.dataView.getUnsigned(1);
		}
		if (inter_ref_pic_set_prediction_flag) {
			var delta_idx_minus1 = 0;
			var k = 0, k0 = 0, k1 = 0;
			if (i === num_short_term_ref_pic_sets) {
				delta_idx_minus1 = bitStreamRead.expGolombToNum();
			}
			if (delta_idx_minus1 > i - 1 || delta_idx_minus1 < 0) {
				throw("HEVCStream.readSPS(): st_ref_pic_set error.")
			}
			var ref_i = i - 1 - delta_idx_minus1; // RefRpsIdx
			var delta_rps_sign = bitStreamRead.dataView.getUnsigned(1);
			var abs_delta_rps_minus1 = bitStreamRead.expGolombToNum();
			var deltaRPS = (1 - (delta_rps_sign << 1)) * (abs_delta_rps_minus1 + 1);
			var num_delta_pocs = num_negative_pics[ref_i] + num_positive_pics[ref_i];
			for (j = 0; j <= num_delta_pocs; j++) {
				var used_by_curr_pic_flag =	bitStreamRead.dataView.getUnsigned(1);
				var ref_idc = used_by_curr_pic_flag ? 1 : 0;
				if (!used_by_curr_pic_flag) {
					var use_delta_flag = bitStreamRead.dataView.getUnsigned(1);
					ref_idc = use_delta_flag << 1;
				}
				if ((ref_idc === 1) || (ref_idc === 2)) {
					var deltaPOC = deltaRPS;
					if (j < num_delta_pocs) {
						deltaPOC += delta_poc[ref_i][j];
					}
					if (delta_poc[i] === undefined) {
						delta_poc[i] = [];
					}
					delta_poc[i][k] = deltaPOC;
					if (deltaPOC < 0) {
						k0++;
					} else {
						k1++;
					}
					k++;
				}
			}
			num_negative_pics[i] = k0;
			num_positive_pics[i] = k1;
		} else {
			var prev = 0;
			var poc = 0;
			var delta_poc_s0_minus1;
			var delta_poc_s1_minus1;
			var used_by_curr_pic_s0_flag;
			var used_by_curr_pic_s1_flag;
			num_negative_pics[i] = bitStreamRead.expGolombToNum();
			num_positive_pics[i] = bitStreamRead.expGolombToNum();
			delta_poc[i] = [];
			for (j = 0; j < num_negative_pics[i]; j++) {
				delta_poc_s0_minus1 = bitStreamRead.expGolombToNum();
				poc = prev - delta_poc_s0_minus1 - 1;
				prev = poc;
				delta_poc[i][j] = poc;
				used_by_curr_pic_s0_flag = bitStreamRead.dataView.getUnsigned(1);
			}
			for (j = 0; j < num_positive_pics[i]; j++) {
				delta_poc_s1_minus1 = bitStreamRead.expGolombToNum();
				poc = prev - delta_poc_s1_minus1 - 1;
				prev = poc;
				delta_poc[i][j] = poc;
				used_by_curr_pic_s1_flag = bitStreamRead.dataView.getUnsigned(1);
			}
		}

		//*********** st_ref_pic_set(stRpsIdx) stRpsIdx = i
	}

	var long_term_ref_pics_present_flag = bitStreamRead.dataView.getUnsigned(1);
	if (long_term_ref_pics_present_flag) {
		var num_long_term_ref_pics_sps = bitStreamRead.expGolombToNum();
		for (i = 0; i < num_long_term_ref_pics_sps; i++) {
			// lt_ref_pic_poc_lsb_sps[i] u(v)
			bitStreamRead.dataView.getUnsigned(log2_max_pic_order_cnt_lsb_minus4 + 4);
			// used_by_curr_pic_lt_sps_flag u(1)
			bitStreamRead.dataView.getUnsigned(1);
		}
	}

	this.SPS.sps_temporal_mvp_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
	this.SPS.strong_intra_smoothing_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
	
	var vui_parameters_present_flag = bitStreamRead.dataView.getUnsigned(1);
	if (vui_parameters_present_flag) {
		var aspect_ratio_info_present_flag = bitStreamRead.dataView.getUnsigned(1);
		if (aspect_ratio_info_present_flag) {
			aspect_ratio_idc = bitStreamRead.dataView.getUnsigned(8);
			if (aspect_ratio_idc === 255) {
				// sar_width u(16), sar_height u(16)
				bitStreamRead.dataView.skip(2);
			}
		}
		var overscan_info_present_flag = bitStreamRead.dataView.getUnsigned(1);
		if (overscan_info_present_flag) {
			// overscan_appropriate_flag u(1)
			bitStreamRead.dataView.getUnsigned(1);
		}
		var video_signal_type_present_flag = bitStreamRead.dataView.getUnsigned(1);
		if (video_signal_type_present_flag) {
			// video_format u(3), video_full_range_flag u(1)
			bitStreamRead.dataView.getUnsigned(4);
			var colour_description_present_flag = bitStreamRead.dataView.getUnsigned(1);
			if (colour_description_present_flag) {
				// colour_primaries u(8), transfer_characteristics u(8), matrix_coeffs u(8)
				bitStreamRead.skip(3);
			}
		}
		var chroma_loc_info_present_flag = bitStreamRead.dataView.getUnsigned(1);
		if (chroma_loc_info_present_flag) {
			// chroma_sample_loc_type_top_field ue(v)
			bitStreamRead.expGolombToNum();
			// chroma_sample_loc_type_bottom_field ue(v)
			bitStreamRead.expGolombToNum();
		}

		// neutral_chroma_indication_flag u(1), field_seq_flag u(1), frame_field_info_present_flag u(1)
		bitStreamRead.dataView.getUnsigned(3);

		var default_display_window_flag = bitStreamRead.dataView.getUnsigned(1);
		if (default_display_window_flag) {
			// def_disp_win_left_offset ue(v)
			bitStreamRead.expGolombToNum();
			// def_disp_win_right_offset ue(v)
			bitStreamRead.expGolombToNum();
			// def_disp_win_top_offset ue(v)
			bitStreamRead.expGolombToNum();
			// def_disp_win_bottom_offset ue(v)
			bitStreamRead.expGolombToNum();
		}

		var vui_timing_info_present_flag = bitStreamRead.dataView.getUnsigned(1);
		if (vui_timing_info_present_flag) {
			// vui_num_units_in_tick u(32), vui_time_scale u(32)
			bitStreamRead.dataView.skip(8);
			var vui_poc_proportional_to_timing_flag = bitStreamRead.dataView.getUnsigned(1);
			if (vui_poc_proportional_to_timing_flag) {
				// vui_num_ticks_poc_diff_one_minus1 ue(v)
				bitStreamRead.expGolombToNum();
			}
			var vui_hrd_parameters_present_flag = bitStreamRead.dataView.getUnsigned(1);
			if (vui_hrd_parameters_present_flag) {
				//*********** hrd_parameters( 1, sps_max_sub_layers_minus1 )
				var nal_hrd_parameters_present_flag = bitStreamRead.dataView.getUnsigned(1);
				var vcl_hrd_parameters_present_flag = bitStreamRead.dataView.getUnsigned(1);
				var sub_pic_hrd_params_present_flag;
				if (nal_hrd_parameters_present_flag || vcl_hrd_parameters_present_flag) {
					sub_pic_hrd_params_present_flag = bitStreamRead.dataView.getUnsigned(1);
					if (sub_pic_hrd_params_present_flag) {
						// tick_divisor_minus2 u(8), du_cpb_removal_delay_increment_length_minus1 u(5),
						// sub_pic_cpb_params_in_pic_timing_sei_flag u(1), dpb_output_delay_du_length_minus1 u(5)
						bitStreamRead.dataView.getUnsigned(19);
					}
					// bit_rate_scale u(4), cpb_size_scale u(4)
					bitStreamRead.dataView.skip(1);
					if (sub_pic_hrd_params_present_flag) {
						// cpb_size_du_scale u(4)
						bitStreamRead.dataView.getUnsigned(4);
					}
					// initial_cpb_removal_delay_length_minus1 u(5), au_cpb_removal_delay_length_minus1 u(5),
					// dpb_output_delay_length_minus1 u(5)
					bitStreamRead.dataView.getUnsigned(15);
				}
				
				var fixed_pic_rate_general_flag;
				var fixed_pic_rate_within_cvs_flag;
				var low_delay_hrd_flag;
				var cpb_cnt_minus1;
				for (i = 0; i <= sps_max_sub_layers_minus1; i++) {
					fixed_pic_rate_within_cvs_flag = 1;
					low_delay_hrd_flag = 0;
					cpb_cnt_minus1 = 0;
					fixed_pic_rate_general_flag = bitStreamRead.dataView.getUnsigned(1);
					if (!fixed_pic_rate_general_flag) {
						// fixed_pic_rate_within_cvs_flag[i] u(1)
						fixed_pic_rate_within_cvs_flag = bitStreamRead.dataView.getUnsigned(1);
					}
					if (fixed_pic_rate_within_cvs_flag) {
						// elemental_duration_in_tc_minus1[i] ue(v)
						bitStreamRead.expGolombToNum();
					} else {
						// low_delay_hrd_flag[i] u(1)
						low_delay_hrd_flag = bitStreamRead.dataView.getUnsigned(1);
					}
					if (!low_delay_hrd_flag) {
						// cpb_cnt_minus1[i] ue(v)
						cpb_cnt_minus1 = bitStreamRead.expGolombToNum();
					}
					if (nal_hrd_parameters_present_flag) {
						//*********** sub_layer_hrd_parameters(i)
						for (j = 0; j <= cpb_cnt_minus1; j++) {
							// bit_rate_value_minus1[i] ue(v)
							bitStreamRead.expGolombToNum();
							// cpb_size_value_minus1[i] ue(v)
							bitStreamRead.expGolombToNum();
							if (sub_pic_hrd_params_present_flag) {
								// cpb_size_du_value_minus1[i] ue(v)
								bitStreamRead.expGolombToNum();
								// bit_rate_du_value_minus1[i] ue(v)
								bitStreamRead.expGolombToNum();
							}
							// cbr_flag[i] u(1)
							bitStreamRead.dataView.getUnsigned(1);
						}
						//*********** sub_layer_hrd_parameters(i)						
					}
					if (vcl_hrd_parameters_present_flag) {
						//*********** sub_layer_hrd_parameters(i)
						for (j = 0; j <= cpb_cnt_minus1; j++) {
							// bit_rate_value_minus1[i] ue(v)
							bitStreamRead.expGolombToNum();
							// cpb_size_value_minus1[i] ue(v)
							bitStreamRead.expGolombToNum();
							if (sub_pic_hrd_params_present_flag) {
								// cpb_size_du_value_minus1[i] ue(v)
								bitStreamRead.expGolombToNum();
								// bit_rate_du_value_minus1[i] ue(v)
								bitStreamRead.expGolombToNum();
							}
							// cbr_flag[i] u(1)
							bitStreamRead.dataView.getUnsigned(1);
						}
						//*********** sub_layer_hrd_parameters(i)						
					}
				}
				//*********** hrd_parameters( 1, sps_max_sub_layers_minus1 )
			}	
		}
		var bitStream_restriction_flag = bitStreamRead.dataView.getUnsigned(1);
		if (bitStream_restriction_flag) {
			// tiles_fixed_structure_flag u(1), motion_vectors_over_pic_boundaries_flag u(1)
			// restricted_ref_pic_lists_flag u(1)
			bitStreamRead.dataView.getUnsigned(3);
			this.SPS.min_spatial_segmentation_idc = bitStreamRead.expGolombToNum();
			// max_bytes_per_pic_denom ue(v)
			bitStreamRead.expGolombToNum();
			// max_bits_per_min_cu_denom ue(v)
			bitStreamRead.expGolombToNum();
			// log2_max_mv_length_horizontal ue(v)
			bitStreamRead.expGolombToNum();
			// log2_max_mv_length_vertical ue(v)
			bitStreamRead.expGolombToNum();
		}
		//*********** vui_parameters()		
	}
	this.SPS.sps_extension_present_flag = bitStreamRead.dataView.getUnsigned(1);
	this.SPS.sps_range_extension_flag = 0;
	if (this.SPS.sps_extension_present_flag) {
		this.SPS.sps_range_extension_flag = bitStreamRead.dataView.getUnsigned(1);
		this.SPS.sps_extension_7bits = bitStreamRead.dataView.getUnsigned(1) * 128 + bitStreamRead.dataView.getUnsigned(6);
	}
	if (this.SPS.sps_range_extension_flag) {
		this.SPS.transform_skip_rotation_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
		this.SPS.transform_skip_context_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
		this.SPS.implicit_rdpcm_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
		this.SPS.explicit_rdpcm_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
		this.SPS.extended_precision_processing_flag = bitStreamRead.dataView.getUnsigned(1);
		this.SPS.intra_smoothing_disabled_flag = bitStreamRead.dataView.getUnsigned(1);
		this.SPS.high_precision_offsets_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
		this.SPS.persistent_rice_adaptation_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
		this.SPS.cabac_bypass_alignment_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
	}	
}

HEVCStream.getNALUType = function (nalu) {
	return ((nalu[0]>>1)&0x3F);
}

/* Used by the generic NALU parser to determine if a NALU starts a new frame */
HEVCStream.isFrameStart = function (nalu, previous_nalu_type) {
	var nalu_type = HEVCStream.getNALUType(nalu);
	var first_slice_in_pic = nalu[2] & 0x80;
	if (previous_nalu_type > 0 && previous_nalu_type !== HEVCStream.PPS_NALU_TYPE) {
		if (first_slice_in_pic) {
			return true;
		}
	}
	return false;
}

HEVCStream.createStreamFromSample = function(sample) {
	var mp4NALUSHead = sample.description.hvcC.nalu_arrays;
	var mp4NALUSData = sample.data;
	
	var hevcstream = new HEVCStream();
	hevcstream.nalu_length = sample.description.hvcC.lengthSizeMinusOne + 1;
	hevcstream.width = sample.description.width;
	hevcstream.height = sample.description.height;
	
	for (var i = 0; i < mp4NALUSHead.length; i++) {
		if (mp4NALUSHead[i].nalu_type === HEVCStream.SPS_NALU_TYPE) {
			hevcstream.readSPS(mp4NALUSHead[i][0].data);
		} else if (mp4NALUSHead[i].nalu_type === HEVCStream.PPS_NALU_TYPE) {
			hevcstream.PPS = mp4NALUSHead[i][0].data;
		}
	}
	hevcstream.data = NALUStream.readSampleData(mp4NALUSData, sample.description.hvcC.lengthSizeMinusOne + 1);
	return hevcstream;
}	

HEVCStream.prototype.getDecoderConfigurationRecord = function() {
	var record = {};
	record.configurationVersion = 1;
	record.general_profile_space = this.SPS.ptl.general_profile_space;
	record.general_tier_flag = this.SPS.ptl.general_tier_space;
	record.general_profile_idc = this.SPS.ptl.general_profile_idc;
	record.general_profile_compatibility = this.SPS.ptl.general_profile_compatibility;
	record.general_constraint_indicator = 0;
	record.general_level_idc = this.SPS.ptl.general_level_idc;
	record.min_spatial_segmentation_idc = this.SPS.min_spatial_segmentation_idc || 0;
	record.parallelismType = 0;
	record.chroma_format_idc = this.SPS.chroma_format_idc;
	record.bit_depth_luma_minus8 = this.SPS.bit_depth_luma_minus8;
	record.bit_depth_chroma_minus8 = this.SPS.bit_depth_chroma_minus8;
	record.avgFrameRate = 0;
	record.constantFrameRate = 0;
	record.numTemporalLayers = 0;
	record.temporalIdNested = 0;
	record.lengthSizeMinusOne = this.nalu_length - 1;
	record.nalu_arrays = [];
	return record;
}

HEVCStream.prototype.setISOMBFFOptions = function(options) {
	if (options) {
		this.nalu_length = options.nalu_length | this.nalu_length;
		if (typeof options.inband_ps != "undefined") {
			this.inband_ps = options.inband_ps;
		}
	}
}

if (typeof exports !== 'undefined') {
	module.exports = HEVCStream;	
}

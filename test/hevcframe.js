/* MP4box/BPG 
 * 2015 - Wesley Marques Dias
 * HEVCFrame
 */


// Construct a HEVCFrame
var HEVCFrame = function() {
	// Sequence Parameter Set
	this.SPS    = {};
	// Picture Parameter Set
	this.PPS    = null;
	// Video Coding Layer
	// Supplemental Enhancement Information
	this.data   = null;
	// Width
	this.width  = null;
	// Height
	this.height = null;
}	

// Function that reads the SPS NAL Unit of a MP4(HEVC), decode and stock them in a structure
HEVCFrame.prototype.readSPS = function (nalu) {

	// Remove Emulation Bytes of the NALU
	var parsedNalu = this.removeEmulationBytes(nalu);

	// bitStream constains all the SPS data
	var bitStreamRead = new BitStream(parsedNalu.buffer);
	
	if (bitStreamRead) {

		/* forbidden_zero_bit f(1), nal_unit_type u(6), 
		nuh_layer_id u(6), nuh_temporal_id_plus1 u(3),
		sps_video_parameter_set_id u(4) */
		bitStreamRead.dataView.getUnsigned(20);
		// sps_max_sub_layers_minus1 u(3)
		var sps_max_sub_layers_minus1 = bitStreamRead.dataView.getUnsigned(3);
		// sps_temporal_id_nesting_flag u(1)
		bitStreamRead.dataView.getUnsigned(1);

		// *********** profile_tier_level( 1, sps_max_sub_layers_minus1 )

		/* general_profile_space u(2), general_tier_flag u(1),
		general_profile_idc (5), general_profile_compatibility_flag u(32),
		general_progressive_source_flag u(1), general_interlaced_source_flag u(1),
		general_non_packed_constraint_flag u(1), general_frame_only_constraint_flag u(1) */
		bitStreamRead.dataView.skip(5);
		bitStreamRead.dataView.getUnsigned(4);
		// if( general_profile_idc = = 4 | | ...
		bitStreamRead.dataView.skip(5);
		bitStreamRead.dataView.getUnsigned(3);
		// if( ( general_profile_idc >= 1 && ...
		bitStreamRead.dataView.getUnsigned(1);
		// general_level_idc u(8)
		bitStreamRead.dataView.skip(1);

		var sub_layer_profile_present_flag = [];
		var sub_layer_level_present_flag = [];
		for (var i = 0; i < sps_max_sub_layers_minus1; i++) {
			// sub_layer_profile_present_flag[i] u(1)
			sub_layer_profile_present_flag[i] = bitStreamRead.dataView.getUnsigned(1);
			// sub_layer_level_present_flag[i] u(1)
			sub_layer_level_present_flag[i] = bitStreamRead.dataView.getUnsigned(1);
		}

		if (sps_max_sub_layers_minus1 > 0) {
			for (var i = sps_max_sub_layers_minus1; i < 8; i++) {
				// reserved_zero_2bits[i] u(2)
				bitStreamRead.dataView.getUnsigned(2);		
			}
		}

		for (var i = 0; i < sps_max_sub_layers_minus1; i++ ) {
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

		// *********** profile_tier_level( 1, sps_max_sub_layers_minus1 )

		// sps_seq_parameter_set_id ue(v)
		bitStreamRead.expGolombToNum();
		// chroma_format_idc ue(v)
		this.SPS.chroma_format_idc = bitStreamRead.expGolombToNum();

		if (this.SPS.chroma_format_idc === 3)
			// separate_colour_plane_flag u(1)
			bitStreamRead.dataView.getUnsigned(1);

		// pic_width_in_luma_samples ue(v)
		bitStreamRead.expGolombToNum();
		// pic_height_in_luma_samples ue(v)
		bitStreamRead.expGolombToNum();

		// conformance_window_flag u(1)
		var conformance_window_flag = bitStreamRead.dataView.getUnsigned(1);		
		if (conformance_window_flag) {
			// conf_win_left_offset ue(v)
			bitStreamRead.expGolombToNum();
			// conf_win_right_offset ue(v)
			bitStreamRead.expGolombToNum();
			// conf_win_top_offset ue(v)
			bitStreamRead.expGolombToNum();
			// conf_win_bottom_offset ue(v)
			bitStreamRead.expGolombToNum();
		}

		// bit_depth_luma_minus8
		this.SPS.bit_depth_luma_minus8 = bitStreamRead.expGolombToNum();
		// bit_depth_chroma_minus8
		this.SPS.bit_depth_chroma_minus8 = bitStreamRead.expGolombToNum();

		//log2_max_pic_order_cnt_lsb_minus4
		var log2_max_pic_order_cnt_lsb_minus4 = bitStreamRead.expGolombToNum();
		// sps_sub_layer_ordering_info_present_flag u(1)
		var sps_sub_layer_ordering_info_present_flag = bitStreamRead.dataView.getUnsigned(1);
		for(var i = sps_sub_layer_ordering_info_present_flag ? 0 : sps_max_sub_layers_minus1; i <= sps_max_sub_layers_minus1; i++) {
			// sps_max_dec_pic_buffering_minus1[i] ue(v)
			bitStreamRead.expGolombToNum();
			// sps_max_num_reorder_pics[i] ue(v) 
			bitStreamRead.expGolombToNum();
			// sps_max_latency_increase_plus1[i] ue(v)
			bitStreamRead.expGolombToNum();
		}

		// log2_min_luma_coding_block_size_minus3 ue(v)
		this.SPS.log2_min_luma_coding_block_size_minus3 = bitStreamRead.expGolombToNum();
		// log2_diff_max_min_luma_coding_block_size ue(v)
		this.SPS.log2_diff_max_min_luma_coding_block_size = bitStreamRead.expGolombToNum();
		// log2_min_transform_block_size_minus2 ue(v)
		this.SPS.log2_min_transform_block_size_minus2 = bitStreamRead.expGolombToNum();
		// log2_diff_max_min_transform_block_size ue(v)
		this.SPS.log2_diff_max_min_transform_block_size = bitStreamRead.expGolombToNum();
		// max_transform_hierarchy_depth_inter ue(v)
		bitStreamRead.expGolombToNum();
		// max_transform_hierarchy_depth_intra ue(v)
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

		// amp_enabled_flag u(1)
		bitStreamRead.dataView.getUnsigned(1);
		// sample_adaptive_offset_enabled_flag u(1)
		this.SPS.sample_adaptive_offset_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
		
		// pcm_enabled_flag u(1)
		this.SPS.pcm_enabled_flag = bitStreamRead.dataView.getUnsigned(1);

		if (this.SPS.pcm_enabled_flag) {
			// pcm_sample_bit_depth_luma_minus1 u(4)
			this.SPS.pcm_sample_bit_depth_luma_minus1 = bitStreamRead.dataView.getUnsigned(4);

			// pcm_sample_bit_depth_chroma_minus1 u(4)
			this.SPS.pcm_sample_bit_depth_chroma_minus1 = bitStreamRead.dataView.getUnsigned(4);

			// log2_min_pcm_luma_coding_block_size_minus3 ue(v)
			this.SPS.log2_min_pcm_luma_coding_block_size_minus3 = bitStreamRead.expGolombToNum();

			// log2_diff_max_min_pcm_luma_coding_block_size ue(v)
			this.SPS.log2_diff_max_min_pcm_luma_coding_block_size = bitStreamRead.expGolombToNum();

			// pcm_loop_filter_disable_flag u(1)
			this.SPS.pcm_loop_filter_disabled_flag = bitStreamRead.dataView.getUnsigned(1);
		}
		
		// num_short_term_ref_pic_sets ue(v)
		var num_short_term_ref_pic_sets = bitStreamRead.expGolombToNum();
		var inter_ref_pic_set_prediction_flag;
		var num_negative_pics = [];
		var num_positive_pics = [];
		var delta_poc = [];
				
		for (i = 0; i < num_short_term_ref_pic_sets; i++) {
			//*********** st_ref_pic_set(stRpsIdx) stRpsIdx = i

			inter_ref_pic_set_prediction_flag = 0;
			if (i)
				// inter_ref_pic_set_prediction_flag u(1)
				inter_ref_pic_set_prediction_flag = bitStreamRead.dataView.getUnsigned(1);
			
			if (inter_ref_pic_set_prediction_flag) {
				var delta_idx_minus1 = 0;
				var k = 0, k0 = 0, k1 = 0;
				if (i === num_short_term_ref_pic_sets)
					// delta_idx_minus1 ue(v)
					delta_idx_minus1 = bitStreamRead.expGolombToNum();

				if (delta_idx_minus1 > i - 1 || delta_idx_minus1 < 0)
					throw("HEVCFrame.readSPS(): st_ref_pic_set error.")

				var ref_i = i - 1 - delta_idx_minus1; // RefRpsIdx

				// delta_rps_sign u(1)
				var delta_rps_sign = bitStreamRead.dataView.getUnsigned(1);
				// abs_delta_rps_minus1 ue(v)
				var abs_delta_rps_minus1 = bitStreamRead.expGolombToNum();

				var deltaRPS = (1 - (delta_rps_sign << 1)) * (abs_delta_rps_minus1 + 1);
				
				var num_delta_pocs = num_negative_pics[ref_i] + num_positive_pics[ref_i];
				for (var j = 0; j <= num_delta_pocs; j++) {
					// used_by_curr_pic_flag u(1)
					var used_by_curr_pic_flag =	bitStreamRead.dataView.getUnsigned(1);
					var ref_idc = used_by_curr_pic_flag ? 1 : 0;
					if (!used_by_curr_pic_flag) {
						// use_delta_flag
						var use_delta_flag = bitStreamRead.dataView.getUnsigned(1);
						ref_idc = use_delta_flag << 1;
					}
					if ((ref_idc === 1) || (ref_idc === 2)) {
						var deltaPOC = deltaRPS;
						if (j < num_delta_pocs)
							deltaPOC += delta_poc[ref_i][j];

						if (delta_poc[i] === undefined)
							delta_poc[i] = [];
						delta_poc[i][k] = deltaPOC;

						if (deltaPOC < 0)  
							k0++;
						else 
							k1++;
						k++;
					}
				}
				num_negative_pics[i] = k0;
				num_positive_pics[i] = k1;
			}
			else {
				var prev = 0;
				var poc = 0;
				var delta_poc_s0_minus1;
				var delta_poc_s1_minus1;
				// num_negative_pics ue(v)
				num_negative_pics[i] = bitStreamRead.expGolombToNum();
				// num_positive_pics ue(v)
				num_positive_pics[i] = bitStreamRead.expGolombToNum();
				delta_poc[i] = [];
				for (var j = 0; j < num_negative_pics[i]; j++) {
					// delta_poc_s0_minus1 ue(v)
					delta_poc_s0_minus1 = bitStreamRead.expGolombToNum();
					poc = prev - delta_poc_s0_minus1 - 1;
					prev = poc;
					delta_poc[i][j] = poc;
					// used_by_curr_pic_s0_flag u(1)
					bitStreamRead.dataView.getUnsigned(1);
				}
				for (var j = 0; j < num_positive_pics[i]; j++) {
					// delta_poc_s1_minus1 ue(v)
					delta_poc_s1_minus1 = bitStreamRead.expGolombToNum();
					poc = prev - delta_poc_s1_minus1 - 1;
					prev = poc;
					delta_poc[i][j] = poc;
					// used_by_curr_pic_s1_flag u(1)
					bitStreamRead.dataView.getUnsigned(1);
				}
			}

			//*********** st_ref_pic_set(stRpsIdx) stRpsIdx = i
		}

		// long_term_ref_pics_present_flag u(1)
		var long_term_ref_pics_present_flag = bitStreamRead.dataView.getUnsigned(1);
		if (long_term_ref_pics_present_flag) {
			// num_long_term_ref_pics_sps ue(v)
			var num_long_term_ref_pics_sps = bitStreamRead.expGolombToNum();
			for (var i = 0; i < num_long_term_ref_pics_sps; i++) {
				// lt_ref_pic_poc_lsb_sps[i] u(v)
				bitStreamRead.dataView.getUnsigned(log2_max_pic_order_cnt_lsb_minus4 + 4);
				// used_by_curr_pic_lt_sps_flag u(1)
				bitStreamRead.dataView.getUnsigned(1);
			}
		}

		// sps_temporal_mvp_enabled_flag u(1)
		bitStreamRead.dataView.getUnsigned(1);
		// strong_intra_smoothing_enabled_flag u(1)
		this.SPS.strong_intra_smoothing_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
		
		// vui_parameters_present_flag u(1)
		var vui_parameters_present_flag = bitStreamRead.dataView.getUnsigned(1);
		if (vui_parameters_present_flag) {
			//*********** vui_parameters()		

			// aspect_ratio_info_present_flag u(1)
			var aspect_ratio_info_present_flag = bitStreamRead.dataView.getUnsigned(1);
			if (aspect_ratio_info_present_flag) {
				// aspect_ratio_idc u(8)
				aspect_ratio_idc = bitStreamRead.dataView.getUnsigned(8);
				if (aspect_ratio_idc === 255) 
					// sar_width u(16), sar_height u(16)
					bitStreamRead.dataView.skip(2);
			}

			// overscan_info_present_flag u(1)
			var overscan_info_present_flag = bitStreamRead.dataView.getUnsigned(1);
			if (overscan_info_present_flag)
				// overscan_appropriate_flag u(1)
				bitStreamRead.dataView.getUnsigned(1);

			// video_signal_type_present_flag u(1) 
			var video_signal_type_present_flag = bitStreamRead.dataView.getUnsigned(1);
			if (video_signal_type_present_flag) {
				// video_format u(3), video_full_range_flag u(1)
				bitStreamRead.dataView.getUnsigned(4);
				// colour_description_present_flag u(1)
				var colour_description_present_flag = bitStreamRead.dataView.getUnsigned(1);
				if (colour_description_present_flag)
					// colour_primaries u(8), transfer_characteristics u(8), matrix_coeffs u(8)
					bitStreamRead.skip(3);
			}

			// chroma_loc_info_present_flag u(1)
			var chroma_loc_info_present_flag = bitStreamRead.dataView.getUnsigned(1);
			if (chroma_loc_info_present_flag) {
				// chroma_sample_loc_type_top_field ue(v)
				bitStreamRead.expGolombToNum();
				// chroma_sample_loc_type_bottom_field ue(v)
				bitStreamRead.expGolombToNum();
			}

			// neutral_chroma_indication_flag u(1), field_seq_flag u(1), frame_field_info_present_flag u(1)
			bitStreamRead.dataView.getUnsigned(3);

			// default_display_window_flag u(1)
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

			// vui_timing_info_present_flag
			var vui_timing_info_present_flag = bitStreamRead.dataView.getUnsigned(1);
			if (vui_timing_info_present_flag) {
				// vui_num_units_in_tick u(32), vui_time_scale u(32)
				bitStreamRead.dataView.skip(8);

				// vui_poc_proportional_to_timing_flag u(1)
				var vui_poc_proportional_to_timing_flag = bitStreamRead.dataView.getUnsigned(1);
				if (vui_poc_proportional_to_timing_flag)
					// vui_num_ticks_poc_diff_one_minus1 ue(v)
					bitStreamRead.expGolombToNum();

				// vui_hrd_parameters_present_flag u(1)
				var vui_hrd_parameters_present_flag = bitStreamRead.dataView.getUnsigned(1);
				if (vui_hrd_parameters_present_flag) {
					//*********** hrd_parameters( 1, sps_max_sub_layers_minus1 )

					// nal_hrd_parameters_present_flag u(1)
					var nal_hrd_parameters_present_flag = bitStreamRead.dataView.getUnsigned(1);
					// vcl_hrd_parameters_present_flag u(1)
					var vcl_hrd_parameters_present_flag = bitStreamRead.dataView.getUnsigned(1);
					var sub_pic_hrd_params_present_flag;
					if (nal_hrd_parameters_present_flag || vcl_hrd_parameters_present_flag) {
						// sub_pic_hrd_params_present_flag u(1)
						sub_pic_hrd_params_present_flag = bitStreamRead.dataView.getUnsigned(1);
						if (sub_pic_hrd_params_present_flag)
							// tick_divisor_minus2 u(8), du_cpb_removal_delay_increment_length_minus1 u(5),
							// sub_pic_cpb_params_in_pic_timing_sei_flag u(1), dpb_output_delay_du_length_minus1 u(5)
							bitStreamRead.dataView.getUnsigned(19);
						// bit_rate_scale u(4), cpb_size_scale u(4)
						bitStreamRead.dataView.skip(1);
						if (sub_pic_hrd_params_present_flag)
							// cpb_size_du_scale u(4)
							bitStreamRead.dataView.getUnsigned(4);
						// initial_cpb_removal_delay_length_minus1 u(5), au_cpb_removal_delay_length_minus1 u(5),
						// dpb_output_delay_length_minus1 u(5)
						bitStreamRead.dataView.getUnsigned(15);
					}
					
					var fixed_pic_rate_general_flag;
					var fixed_pic_rate_within_cvs_flag;
					var low_delay_hrd_flag;
					var cpb_cnt_minus1;
					for (var i = 0; i <= sps_max_sub_layers_minus1; i++) {
						fixed_pic_rate_within_cvs_flag = 1;
						low_delay_hrd_flag = 0;
						cpb_cnt_minus1 = 0;
						// fixed_pic_rate_general_flag[i] u(1)
						fixed_pic_rate_general_flag = bitStreamRead.dataView.getUnsigned(1);
						if (!fixed_pic_rate_general_flag)
							// fixed_pic_rate_within_cvs_flag[i] u(1)
							fixed_pic_rate_within_cvs_flag = bitStreamRead.dataView.getUnsigned(1);
						if (fixed_pic_rate_within_cvs_flag)
							// elemental_duration_in_tc_minus1[i] ue(v)
							bitStreamRead.expGolombToNum();
						else
							// low_delay_hrd_flag[i] u(1)
							low_delay_hrd_flag = bitStreamRead.dataView.getUnsigned(1);
						if (!low_delay_hrd_flag)
							// cpb_cnt_minus1[i] ue(v)
							cpb_cnt_minus1 = bitStreamRead.expGolombToNum();
						if (nal_hrd_parameters_present_flag) {
							//*********** sub_layer_hrd_parameters(i)

							for (var i = 0; i <= cpb_cnt_minus1; i++) {
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
							
							for (var i = 0; i <= cpb_cnt_minus1; i++) {
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
			
			// bitStreamRead_restriction_flag u(1)
			var bitStreamRead_restriction_flag = bitStreamRead.dataView.getUnsigned(1);
			if (bitStreamRead_restriction_flag) {
				// tiles_fixed_structure_flag u(1), motion_vectors_over_pic_boundaries_flag u(1)
				// restricted_ref_pic_lists_flag u(1)
				bitStreamRead.dataView.getUnsigned(3);
				// min_spatial_segmentation_idc ue(v)
				bitStreamRead.expGolombToNum();
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

		// sps_extension_present_flag u(1)
		this.SPS.sps_extension_present_flag = bitStreamRead.dataView.getUnsigned(1);

		this.SPS.sps_range_extension_flag = 0;
		if (this.SPS.sps_extension_present_flag) {
			// sps_range_extension_flag u(1)
			this.SPS.sps_range_extension_flag = bitStreamRead.dataView.getUnsigned(1);
			// sps_multilayer_extension_flag u(1) and sps_extension_6bits u(6)
			this.SPS.sps_extension_7bits = bitStreamRead.dataView.getUnsigned(1) * 128 + bitStreamRead.dataView.getUnsigned(6);
		}

		if (this.SPS.sps_range_extension_flag) {
			// transform_skip_rotation_enabled_flag u(1)
			this.SPS.transform_skip_rotation_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
			// transform_skip_context_enabled_flag u(1)
			this.SPS.transform_skip_context_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
			// implicit_rdpcm_enabled_flag u(1)
			this.SPS.implicit_rdpcm_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
			// explicit_rdpcm_enabled_flag u(1)
			this.SPS.explicit_rdpcm_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
			// extended_precision_processing_flag u(1)
			this.SPS.extended_precision_processing_flag = bitStreamRead.dataView.getUnsigned(1);
			// intra_smoothing_disabled_flag u(1)
			this.SPS.intra_smoothing_disabled_flag = bitStreamRead.dataView.getUnsigned(1);
			// high_precision_offsets_enabled_flag u(1)
			this.SPS.high_precision_offsets_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
			// persistent_rice_adaptation_enabled_flag u(1)
			this.SPS.persistent_rice_adaptation_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
			// cabac_bypass_alignment_enabled_flag u(1)
			this.SPS.cabac_bypass_alignment_enabled_flag = bitStreamRead.dataView.getUnsigned(1);
		}	
	}
}

// Function that removes Emulation Bytes  
HEVCFrame.prototype.removeEmulationBytes = function(nalu) {

	var emulationBytesCount = 0;
	var numZeros = 0;
	var arrayBuffer = new ArrayBuffer(nalu.length);
	var parsedNalu = new Uint8Array(arrayBuffer);

	for (var i = 0; i < nalu.length; i++) {
		/*ISO 14496-10: "Within the NAL unit, any four-byte sequence that starts with 0x000003
		other than the following sequences shall not occur at any byte-aligned position:
		0x00000300
		0x00000301
		0x00000302
		0x00000303"
		*/
		if (numZeros === 2 && nalu[i] === 0x03 && i+1 < nalu.length /*next byte is readable*/ && nalu[i+1] < 0x04)	{
			/*emulation code found*/
			numZeros = 0;
			emulationBytesCount++;
			i++;
		}

		parsedNalu[i-emulationBytesCount] = nalu[i];

		if (!nalu[i])
			numZeros++;
		else
			numZeros = 0;
	}
	return parsedNalu;
}

// Function that parses and read VCL and SEI (removing the Starting Length from each data NALU and adding a Starting Code)
// Starting Length: size from lengthSizeMinusOne property  
// Starting Code: 0x00000001
HEVCFrame.prototype.readData = function(data, headerLength) {
	var arrayBuffer = new ArrayBuffer(data.length);
	var parsedData = new Uint8Array(arrayBuffer);
	var naluLength = 0;; // Length of each NALU
	var i /* data iterator */, j /* parsedData iterator */, k /* NALU iterator */, l;
	for (i = 0, j = 0, k = 0; i < data.length; i++, j++, k++) {
		if (k === naluLength) {
			naluLength = 0;
			k = 0;
			// Get the length of the next NALU
			for (l = headerLength + i; i < l ; i++)
				naluLength += data[i] * Math.pow(2, (l - i - 1) * 8);
			// Insert Start Code
			for (l = 3 + j; j < l; j++)
				parsedData[j] = 0;
			parsedData[j] = 1;
			j++;
		}
		parsedData[j] = data[i];
	}

	this.data = parsedData;
}

HEVCFrame.prototype.toBPG = function(fileSize) {
    var bpg = new BPG();

    bpg.file_size = fileSize; // Just a ceil

    bpg.file_magic = 0x425047fb;
    
    bpg.pixel_format = this.SPS.chroma_format_idc;
    bpg.alpha1_flag = 0; // ?
    if (this.SPS.bit_depth_luma_minus8 === this.SPS.bit_depth_chroma_minus8)
    	bpg.bit_depth_minus_8 = this.SPS.bit_depth_chroma_minus8;
    else
    	throw ("HEVCFrame.toBPG(): Could not extract image.");

    bpg.color_space = 0;
    bpg.extension_present_flag = 0;
    bpg.alpha2_flag = 0;
    bpg.limited_range_flag = 0;
    bpg.animation_flag = 0;
     
    bpg.picture_width = this.width
    bpg.picture_height = this.height
     
    // picture_data_length (we put 0 for the moment to go up to the end of file)  
    bpg.picture_data_length = 0;

    bpg.header = {};

    bpg.header.hevc_header_length = fileSize; // Just a ceil
    bpg.header.log2_min_luma_coding_block_size_minus3 = this.SPS.log2_min_luma_coding_block_size_minus3;
    bpg.header.log2_diff_max_min_luma_coding_block_size = this.SPS.log2_diff_max_min_luma_coding_block_size;
    bpg.header.log2_min_transform_block_size_minus2 = this.SPS.log2_min_transform_block_size_minus2;
    bpg.header.log2_diff_max_min_transform_block_size = this.SPS.log2_diff_max_min_transform_block_size;
    bpg.header.max_transform_hierarchy_depth_intra = this.SPS.max_transform_hierarchy_depth_intra;
    bpg.header.sample_adaptive_offset_enabled_flag = this.SPS.sample_adaptive_offset_enabled_flag;
    bpg.header.pcm_enabled_flag = this.SPS.pcm_enabled_flag;

    if (bpg.header.pcm_enabled_flag) {
        bpg.header.pcm_sample_bit_depth_luma_minus1 = this.SPS.pcm_sample_bit_depth_luma_minus1;
        bpg.header.pcm_sample_bit_depth_chroma_minus1 = this.SPS.pcm_sample_bit_depth_chroma_minus1;
        bpg.header.log2_min_pcm_luma_coding_block_size_minus3 = this.SPS.log2_min_pcm_luma_coding_block_size_minus3;
        bpg.header.log2_diff_max_min_pcm_luma_coding_block_size = this.SPS.log2_diff_max_min_pcm_luma_coding_block_size;
        bpg.header.pcm_loop_filter_disabled_flag = this.SPS.pcm_loop_filter_disabled_flag;
    }
    bpg.header.strong_intra_smoothing_enabled_flag = this.SPS.strong_intra_smoothing_enabled_flag;
    bpg.header.sps_extension_present_flag = this.SPS.sps_extension_present_flag;
    if (bpg.header.sps_extension_present_flag) {
        bpg.header.sps_range_extension_flag = this.SPS.sps_range_extension_flag;
        bpg.header.sps_extension_7bits = this.SPS.sps_extension_7bits;
    }
    if (this.SPS.sps_range_extension_flag) {
        bpg.header.transform_skip_rotation_enabled_flag = this.SPS.transform_skip_rotation_enabled_flag;
        bpg.header.transform_skip_context_enabled_flag = this.SPS.transform_skip_context_enabled_flag;
        bpg.header.implicit_rdpcm_enabled_flag = this.SPS.implicit_rdpcm_enabled_flag;
        bpg.header.explicit_rdpcm_enabled_flag = this.SPS.explicit_rdpcm_enabled_flag;
        bpg.header.extended_precision_processing_flag = this.SPS.extended_precision_processing_flag;
        bpg.header.intra_smoothing_disabled_flag = this.SPS.intra_smoothing_disabled_flag;
        bpg.header.high_precision_offsets_enabled_flag = this.SPS.high_precision_offsets_enabled_flag;
        bpg.header.persistent_rice_adaptation_enabled_flag = this.SPS.persistent_rice_adaptation_enabled_flag;
        bpg.header.cabac_bypass_alignment_enabled_flag = this.SPS.cabac_bypass_alignment_enabled_flag;
    }
    
    // PPS, VCL and SEI
    bpg.hevc_data_byte = [];
    var j = 0;
    for (var i = 0; i < this.PPS.length; i++, j++) {
        bpg.hevc_data_byte[j] = this.PPS[i];
    }
    for (var i = 0; i < this.data.length; i++, j++) {
        bpg.hevc_data_byte[j] = this.data[i];
    }

    return bpg;
}
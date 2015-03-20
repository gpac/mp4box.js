var hevcURL = "http://download.tsi.telecom-paristech.fr/gpac/dataset/dash/uhd/mux_sources/hevcds_720p30_2M.mp4";


/* Setting the level of logs (error, warning, info, debug) */
Log.setLogLevel(Log.d);

/* The main object processing the mp4 files */
var mp4box;

/* object responsible for file downloading */
var downloader;

window.onload = function () {
	//load();
	// var buffer = new ArrayBuffer(1000);
    //var arr = new Uint8Array(buffer);
	// var bitstream1 = new jDataView(buffer);
	// var bitstream2 = new jDataView(buffer);
   	//var init_pos = bitstream.tell();

   	/***********************************/

	// Write numbers from 1 to 10 into bitstream using 1 bit and ajust the byte-padding
	// for (var i = 0; i < 16; i++)
	// 	if (i < 10)
	// 		bitstream.writeUnsigned(i+1, 1);
	// 	else
	// 		bitstream.writeUnsigned(0, 1);

	// Go to the first position
	// bitstream.seek(init_pos);

	// Read bits from the bitstream
	// for (var i = 0; i < 10; i++)
	// 	console.log(bitstream.getUnsigned(1));

	/***********************************/

    // Write numbers from 1 to 152 in Exp-Golomb code into the bitstream (152 for byte-alignement)
    //for (var i = 0; i < 153; i++)
	//	num_set_ue(i, bitstream1);

   	// Read numbers in Exp-Golomb code from the bitstream
	//for (var i = 0; i < 152; i++)
	//	console.log(bitstream_get_ue(bitstream2));
	
	/***********************************/
	/* Load a BPG image and read its syntax */

	var fileInput = document.getElementById('fileInput');

	fileInput.addEventListener('change',
		function(e) {
			var file = fileInput.files[0];
			var fileReader = new FileReader();

			fileReader.onload =
				function(e) {
					var arrayBufferRead = fileReader.result;
					console.log("Start reading the BPG");
                    var bitStreamRead = new BitStream(arrayBufferRead);
				    var bpg = new BPG(bitStreamRead);
				    console.log("Start saving the BPG");
                    bpg.toFile("lena.bpg");
				}
			fileReader.readAsArrayBuffer(file);	
		}
	); 
	
}     

function load() {

	mp4box = new MP4Box();
	mp4box.onMoovStart = function () {
		Log.i("Application", "Starting to parse movie information");
	}
	mp4box.onReady = function (info) {
		Log.i("Application", "Movie information received");
		movieInfo = info;
		mp4box.setExtractionOptions(2, null, { nbitstreamamples: 1 });
	}
	mp4box.onSamples = function (id, user, samples) {	
		var texttrack = user;
		Log.i("Track #"+id,"Received "+samples.length+" new sample(s)");
		for (var j = 0; j < samples.length; j++) {
			var sample = samples[j];
			if (sample.description.type === "hvc1") {
				console.log(sample.description.hvcC);
				console.log(sample.data);
				// Send MP4 data to build a BPG
				buildBPG(sample);
			}
		}
		downloader.stop();
		mp4box.unsetExtractionOptions(1);
	}	

    downloader = new Downloader();
	downloader.setCallback(
		function (response, end, error) { 
			if (response) {
				mp4box.appendBuffer(response);
			}
			if (end) {
				mp4box.flush();
			}
			if (error) {
				console.log("error downloading");
			}
		}
	);
	downloader.setUrl(hevcURL);
	downloader.setInterval(1000);
	downloader.setChunkSize(1000000);
	downloader.start();
}

function saveBuffer(buffer, name) {     
    if (saveChecked.checked) {
        var d = new DataStream(buffer);
        d.save(name);
    }
}

// Function that reads the SPS NAL Unit of a MP4(HEVC), decode and stock them in a structure
function read_sps_nalu_data(sps_nalu_data) {
	// bitstream constains all the SPS data
	var bitstream = new jDataView(mp4_sps_nalu_data);  
	var sps_mp4;
	
	if (bitstream != null)	{
		/* forbidden_zero_bit f(1), nal_unit_type u(6), 
		nuh_layer_id u(6), nuh_temporal_id_plus1 u(3),
		sps_video_parameter_set_id u(4) */
		bitstream.getUnsigned(20);
		// sps_max_sub_layers_minus1 u(3)
		sps_max_sub_layers_minus1 = bitstream.getUnsigned(3);
		// sps_temporal_id_nesting_flag u(1)
		bitstream.getUnsigned(1);

		// *********** profile_tier_level( 1, sps_max_sub_layers_minus1 )

		/* general_profile_space u(2), general_tier_flag u(1),
		general_profile_idc (5), general_profile_compatibility_flag u(32),
		general_progressive_source_flag u(1), general_interlaced_source_flag u(1),
		general_non_packed_constraint_flag u(1), general_frame_only_constraint_flag u(1) */
		bitstream.skip(5);
		bitstream.getUnsigned(4);
		// if( general_profile_idc = = 4 | | ...
		bitstream.skip(5);
		bitstream.getUnsigned(3);
		// if( ( general_profile_idc >= 1 && ...
		bitstream.getUnsigned(1);
		// general_level_idc u(8)
		bitstream.skip(1);

		var sub_layer_profile_present_flag = [];
		var sub_layer_level_present_flag = [];
		for (var i = 0; i < sps_max_sub_layers_minus1; i++) {
			// sub_layer_profile_present_flag[i] u(1)
			sub_layer_profile_present_flag[i] = bitstream.getUnsigned(1);
			// sub_layer_level_present_flag[i] u(1)
			sub_layer_level_present_flag[i] = bitstream.getUnsigned(1);
		}

		if (sps_max_sub_layers_minus1 > 0) {
			for (var i = sps_max_sub_layers_minus1; i < 8; i++) {
				// reserved_zero_2bits[i] u(2)
				bitstream.getUnsigned(2);		
			}
		}

		for (var i = 0; i < sps_max_sub_layers_minus1; i++ ) {
			if (sub_layer_profile_present_flag[i]) {
				/* sub_layer_profile_space[i] u(2), sub_layer_tier_flag[i] u(1),
				sub_layer_profile_idc[i] u(5), sub_layer_profile_compatibility_flag[i] u(32),
				sub_layer_progressive_source_flag[i] u(1), sub_layer_interlaced_source_flag[i] u(1),
				sub_layer_non_packed_constraint_flag[i] u(1), sub_layer_frame_only_constraint_flag[i] u(1) */
				bitstream.skip(5);
				bitstream.getUnsigned(4);
				// if( sub_layer_profile_idc[ i ] = = 4 | | ...
				bitstream.skip(5);
				bitstream.getUnsigned(3);
				// if( ( sub_layer_profile_idc[ i ] >= 1 && ...
				bitstream.getUnsigned(1);
			}

			if (sub_layer_level_present_flag[i]) 
				// sub_layer_level_idc [i] u(8)
				bitstream.skip(1);
		}

		// *********** profile_tier_level( 1, sps_max_sub_layers_minus1 )

		// sps_seq_parameter_set_id ue(v)
		bitstream_get_ue(bitstream);
		// chroma_format_idc ue(v)
		sps.chroma_format_idc = bitstream_get_ue(bitstream);

		if (sps.chroma_format_idc == 3)
			// separate_colour_plane_flag u(1)
			bitstream.getUnsigned(1);

		// pic_width_in_luma_samples ue(v)
		bitstream_get_ue(bitstream);
		// pic_height_in_luma_samples ue(v)
		bitstream_get_ue(bitstream);

		// conformance_window_flag u(1)
		var conformance_window_flag = bitstream.getUnsigned(1);		
		if (conformance_window_flag) {
			// conf_win_left_offset ue(v)
			bitstream_get_ue(bitstream);
			// conf_win_right_offset ue(v)
			bitstream_get_ue(bitstream);
			// conf_win_top_offset ue(v)
			bitstream_get_ue(bitstream);
			// conf_win_bottom_offset ue(v)
			bitstream_get_ue(bitstream);
		}

		// bit_depth_luma_minus8
		sps.bit_depth_luma_minus8 = bitstream_get_ue(bitstream);
		// bit_depth_chroma_minus8
		sps.bit_depth_chroma_minus8 = bitstream_get_ue(bitstream);

		//log2_max_pic_order_cnt_lsb_minus4
		var log2_max_pic_order_cnt_lsb_minus4 = bitstream_get_ue(bitstream);
		// sps_sub_layer_ordering_info_present_flag u(1)
		var sps_sub_layer_ordering_info_present_flag = bitstream.getUnsigned(1);
		for(var i = sps_sub_layer_ordering_info_present_flag ? 0 : sps_max_sub_layers_minus1; i <= max_sub_layers_minus1; i++) {
			// sps_max_dec_pic_buffering_minus1[i] ue(v)
			bitstream_get_ue(bitstream);
			// sps_max_num_reorder_pics[i] ue(v) 
			bitstream_get_ue(bitstream);
			// sps_max_latency_increase_plus1[i] ue(v)
			bitstream_get_ue(bitstream);
		}

		// log2_min_luma_coding_block_size_minus3 ue(v)
		sps.log2_min_luma_coding_block_size_minus3 = bitstream_get_ue(bitstream);
		// log2_diff_max_min_luma_coding_block_size ue(v)
		sps.log2_diff_max_min_luma_coding_block_size = bitstream_get_ue(bitstream);
		// log2_min_transform_block_size_minus2 ue(v)
		sps.log2_min_transform_block_size_minus2 = bitstream_get_ue(bitstream);
		// log2_diff_max_min_transform_block_size ue(v)
		sps.log2_diff_max_min_transform_block_size = bitstream_get_ue(bitstream);
		// max_transform_hierarchy_depth_inter ue(v)
		bitstream_get_ue(bitstream);
		// max_transform_hierarchy_depth_intra ue(v)
		sps.max_transform_hierarchy_depth_intra = bitstream_get_ue(bitstream);
		
		// scaling_list_enabled_flag u(1)
		var scaling_list_enable_flag = bitstream.getUnsigned(1);
		if (scaling_list_enable_flag) {
			
			// sps_scaling_list_data_present_flag u(1)
			var sps_scaling_list_data_present_flag = bitstream.getUnsigned(1);
			if (sps_scaling_list_data_present_flag) {
				
				// *********** scaling_list_data( )
				
				var scaling_list_pred_mode_flag = [];
				var scaling_list_dc_coef_minus8 = [];
				var coefNum;
				for (var sizeId = 0; sizeId < 4; sizeId++) {
					for (var matrixId = 0; matrixId < 6; matrixId += (sizeId === 3) ? 3 : 1) {
						
						// scaling_list_pred_mode_flag[sizeId][matrixId]
						if (scaling_list_pred_mode_flag[sizeId] == undefined)
							scaling_list_pred_mode_flag[sizeId] = [];
						scaling_list_pred_mode_flag[sizeId][matrixId] = bitstream_get_ue(bitstream);
						
						if (!scaling_list_pred_mode_flag[sizeId][matrixId])
							// scaling_list_pred_matrix_id_delta[sizeId][matrixId] ue(v)
							bitstream_get_ue(bitstream);
						else {
							coefNum = Math.min(64,(1 << (4+(sizeId << 1))));
							
							if (sizeId > 1)
								// scaling_list_dc_coef_minus8[sizeId − 2][matrixId] se(v)
								bitstream_get_ue(bitstream);
							for (i = 0; i < coefNum; i++) {
								// scaling_list_delta_coef se(v)
								bitstream_get_ue(bitstream);
							}
						}
					}
				}

				// *********** scaling_list_data( )
			}
		}

		// amp_enabled_flag u(1)
		bitstream.getUnsigned(1);
		// sample_adaptive_offset_enabled_flag u(1)
		sps.sample_adaptive_offset_enabled_flag = bitstream.getUnsigned(1);
		
		// pcm_enabled_flag u(1)
		sps.pcm_enabled_flag = bitstream.getUnsigned(1);
		if (sps.pcm_enabled_flag) {
			// pcm_sample_bit_depth_luma_minus1 u(4)
			sps.pcm_sample_bit_depth_luma_minus1 = bitstream.getUnsigned(4);

			// pcm_sample_bit_depth_chroma_minus1 u(4)
			sps.pcm_sample_bit_depth_chroma_minus1 = bitstream.getUnsigned(4);

			// log2_min_pcm_luma_coding_block_size_minus3 ue(v)
			sps.log2_min_pcm_luma_coding_block_size_minus3 = bitstream_get_ue(bitstream);

			// log2_diff_max_min_pcm_luma_coding_block_size ue(v)
			sps.log2_diff_max_min_pcm_luma_coding_block_size = bitstream_get_ue(bitstream);

			// pcm_loop_filter_disable_flag u(1)
			sps.pcm_loop_filter_disable_flag = bitstream.getUnsigned(1);
		}
		
		// num_short_term_ref_pic_sets ue(v)
		var num_short_term_ref_pic_sets = bitstream_get_ue(bitstream);
		var inter_ref_pic_set_prediction_flag;
		var num_negative_pics;
		var num_positive_pics;
		var used_by_curr_pic_flag;
		for (i = 0; i < num_short_term_ref_pic_sets; i++) {
			//*********** st_ref_pic_set(i)

			inter_ref_pic_set_prediction_flag = 0;
			if (i)
				// inter_ref_pic_set_prediction_flag u(1)
				inter_ref_pic_set_prediction_flag = bitstream.getUnsigned(1);
			
			if (inter_ref_pic_set_prediction_flag) {
				if (i === num_short_term_ref_pic_sets)
					// delta_idx_minus1 ue(v)
					bitstream_get_ue(bitstream);

				// delta_rps_sign u(1)
				bitstream.getUnsigned(1);
				// abs_delta_rps_minus1 ue(v)
				bitstream_get_ue(bitstream);
				// for( j = 0; j <= NumDeltaPocs[ RefRpsIdx ] = 0 ; j++ ) { 
				
				// used_by_curr_pic_flag u(1)
				used_by_curr_pic_flag =	bitstream.getUnsigned(1);
				if (!used_by_curr_pic_flag)
					// use_delta_flag
					bitstream.getUnsigned(1);
			}
			else {
				// num_negative_pics ue(v)
				num_negative_pics = bitstream_get_ue(bitstream);
				// num_positive_pics ue(v)
				num_positive_pics = bitstream_get_ue(bitstream);
				for (var i = 0; i < num_negative_pics; i++) {
					// delta_poc_s0_minus1[i] ue(v)
					bitstream_get_ue(bitstream);
					// used_by_curr_pic_s0_flag[i] u(1)
					bitstream.getUnsigned(1);
				}
				for (var i = 0; i < num_positive_pics; i++) {
					// delta_poc_s1_minus1[i] ue(v)
					bitstream_get_ue(bitstream);
					// used_by_curr_pic_s1_flag[i] u(1)
					bitstream.getUnsigned(1);
				}
			}

			//*********** st_ref_pic_set(i)
		}

		// long_term_ref_pics_present_flag u(1)
		var long_term_ref_pics_present_flag = bitstream.getUnsigned(1);
		if (long_term_ref_pics_present_flag) {
			// num_long_term_ref_pics_sps ue(v)
			var num_long_term_ref_pics_sps = bitstream_get_ue(bitstream);
			for (var i = 0; i < num_long_term_ref_pics_sps; i++) {
				// lt_ref_pic_poc_lsb_sps[i] u(v)
				bitstream.getUnsigned(log2_max_pic_order_cnt_lsb_minus4 + 4);
				// used_by_curr_pic_lt_sps_flag u(1)
				bitstream.getUnsigned(1);
			}
		}

		// sps_temporal_mvp_enabled_flag u(1)
		bitstream.getUnsigned(1);
		// strong_intra_smoothing_enabled_flag u(1)
		sps.strong_intra_smoothing_enabled_flag = bitstream.getUnsigned(1);
		
		// vui_parameters_present_flag u(1)
		var vui_parameters_present_flag = bitstream.getUnsigned(1);
		if (vui_parameters_present_flag) {
			//*********** vui_parameters()		

			// aspect_ratio_info_present_flag u(1)
			var aspect_ratio_info_present_flag = bitstream.getUnsigned(1);
			if (aspect_ratio_info_present_flag) {
				// aspect_ratio_idc u(8)
				aspect_ratio_idc = bitstream.getUnsigned(8);
				if (aspect_ratio_idc === 255) 
					// sar_width u(16), sar_height u(16)
					bitstream.skip(2);
			}

			// overscan_info_present_flag u(1)
			var overscan_info_present_flag = bitstream.getUnsigned(1);
			if (overscan_info_present_flag)
				// overscan_appropriate_flag u(1)
				bitstream.getUnsigned(1);

			// video_signal_type_present_flag u(1) 
			var video_signal_type_present_flag = bitstream.getUnsigned(1);
			if (video_signal_type_present_flag) {
				// video_format u(3), video_full_range_flag u(1)
				bitstream.getUnsigned(4);
				// colour_description_present_flag u(1)
				var colour_description_present_flag = bitstream.getUnsigned(1);
				if (colour_description_present_flag)
					// colour_primaries u(8), transfer_characteristics u(8), matrix_coeffs u(8)
					bitstream.skip(3);
			}

			// chroma_loc_info_present_flag u(1)
			var chroma_loc_info_present_flag = bitstream.getUnsigned(1);
			if (chroma_loc_info_present_flag) {
				// chroma_sample_loc_type_top_field ue(v)
				bitstream_get_ue(bitstream);
				// chroma_sample_loc_type_bottom_field ue(v)
				bitstream_get_ue(bitstream);
			}

			// neutral_chroma_indication_flag u(1), field_seq_flag u(1), frame_field_info_present_flag u(1)
			bitstream.getUnsigned(3);

			// default_display_window_flag u(1)
			var default_display_window_flag = bitstream.getUnsigned(1);
			if (default_display_window_flag) {
				// def_disp_win_left_offset ue(v)
				bitstream_get_ue(bitstream);
				// def_disp_win_right_offset ue(v)
				bitstream_get_ue(bitstream);
				// def_disp_win_top_offset ue(v)
				bitstream_get_ue(bitstream);
				// def_disp_win_bottom_offset ue(v)
				bitstream_get_ue(bitstream);
			}

			// vui_timing_info_present_flag
			var vui_timing_info_present_flag = bitstream.getUnsigned(1);
			if (vui_timing_info_present_flag) {
				// vui_num_units_in_tick u(32), vui_time_scale u(32)
				bitstream.skip(8);

				// vui_poc_proportional_to_timing_flag u(1)
				var vui_poc_proportional_to_timing_flag = bitstream.getUnsigned(1);
				if (vui_poc_proportional_to_timing_flag)
					// vui_num_ticks_poc_diff_one_minus1 ue(v)
					bitstream_get_ue(bitstream);

				// vui_hrd_parameters_present_flag u(1)
				var vui_hrd_parameters_present_flag = bitstream.getUnsigned(1);
				if (vui_hrd_parameters_present_flag) {
					//*********** hrd_parameters( 1, sps_max_sub_layers_minus1 )

					// nal_hrd_parameters_present_flag u(1)
					var nal_hrd_parameters_present_flag = bitstream.getUnsigned(1);
					// vcl_hrd_parameters_present_flag u(1)
					var vcl_hrd_parameters_present_flag = bitstream.getUnsigned(1);
					var sub_pic_hrd_params_present_flag;
					if (nal_hrd_parameters_present_flag || vcl_hrd_parameters_present_flag) {
						// sub_pic_hrd_params_present_flag u(1)
						sub_pic_hrd_params_present_flag = bitstream.getUnsigned(1);
						if (sub_pic_hrd_params_present_flag)
							// tick_divisor_minus2 u(8), du_cpb_removal_delay_increment_length_minus1 u(5),
							// sub_pic_cpb_params_in_pic_timing_sei_flag u(1), dpb_output_delay_du_length_minus1 u(5)
							bitstream.getUnsigned(19);
						// bit_rate_scale u(4), cpb_size_scale u(4)
						bitstream.skip(1);
						if (sub_pic_hrd_params_present_flag)
							// cpb_size_du_scale u(4)
							bitstream.getUnsigned(4);
						// initial_cpb_removal_delay_length_minus1 u(5), au_cpb_removal_delay_length_minus1 u(5),
						// dpb_output_delay_length_minus1 u(5)
						bitstream.getUnsigned(15);
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
						fixed_pic_rate_general_flag = bitstream.getUnsigned(1);
						if (!fixed_pic_rate_general_flag)
							// fixed_pic_rate_within_cvs_flag[i] u(1)
							fixed_pic_rate_within_cvs_flag = bitstream.getUnsigned(1);
						if (fixed_pic_rate_within_cvs_flag)
							// elemental_duration_in_tc_minus1[i] ue(v)
							bitstream_get_ue(bitstream);
						else
							// low_delay_hrd_flag[i] u(1)
							low_delay_hrd_flag = bitstream.getUnsigned(1);
						if (!low_delay_hrd_flag)
							// cpb_cnt_minus1[i] ue(v)
							cpb_cnt_minus1 = bitstream_get_ue(bitstream);
						if (nal_hrd_parameters_present_flag) {
							//*********** sub_layer_hrd_parameters(i)

							for (var i = 0; i <= cpb_cnt_minus1; i++) {
								// bit_rate_value_minus1[i] ue(v)
								bitstream_get_ue(bitstream);
								// cpb_size_value_minus1[i] ue(v)
								bitstream_get_ue(bitstream);
								if (sub_pic_hrd_params_present_flag) {
									// cpb_size_du_value_minus1[i] ue(v)
									bitstream_get_ue(bitstream);
									// bit_rate_du_value_minus1[i] ue(v)
									bitstream_get_ue(bitstream);
								}
								// cbr_flag[i] u(1)
								bitstream.getUnsigned(1);
							}
							//*********** sub_layer_hrd_parameters(i)						
						}

						if (vcl_hrd_parameters_present_flag) {
							//*********** sub_layer_hrd_parameters(i)
							
							for (var i = 0; i <= cpb_cnt_minus1; i++) {
								// bit_rate_value_minus1[i] ue(v)
								bitstream_get_ue(bitstream);
								// cpb_size_value_minus1[i] ue(v)
								bitstream_get_ue(bitstream);
								if (sub_pic_hrd_params_present_flag) {
									// cpb_size_du_value_minus1[i] ue(v)
									bitstream_get_ue(bitstream);
									// bit_rate_du_value_minus1[i] ue(v)
									bitstream_get_ue(bitstream);
								}
								// cbr_flag[i] u(1)
								bitstream.getUnsigned(1);
							}

							//*********** sub_layer_hrd_parameters(i)						
						}

					}

					//*********** hrd_parameters( 1, sps_max_sub_layers_minus1 )
				}	
			}
			
			// bitstream_restriction_flag u(1)
			var bitstream_restriction_flag = bitstream.getUnsigned(1);
			if (bitstream_restriction_flag) {
				// tiles_fixed_structure_flag u(1), motion_vectors_over_pic_boundaries_flag u(1)
				// restricted_ref_pic_lists_flag u(1)
				bitstream.getUnsigned(3);
				// min_spatial_segmentation_idc ue(v)
				bitstream_get_ue(bitstream);
				// max_bytes_per_pic_denom ue(v)
				bitstream_get_ue(bitstream);
				// max_bits_per_min_cu_denom ue(v)
				bitstream_get_ue(bitstream);
				// log2_max_mv_length_horizontal ue(v)
				bitstream_get_ue(bitstream);
				// log2_max_mv_length_vertical ue(v)
				bitstream_get_ue(bitstream);
			}

			//*********** vui_parameters()		
		}

		// sps_extension_present_flag u(1)
		sps.sps_extension_present_flag = bitstream.getUnsigned(1);
		sps.sps_range_extension_flag = 0;
		if (sps_extension_present_flag) {
			// sps_range_extension_flag u(1)
			sps.sps_range_extension_flag = bitstream.getUnsigned(1);
			// sps_multilayer_extension_flag u(1)
			bitstream.getUnsigned(1);
			// sps_extension_6bits u(6)
			bitstream.getUnsigned(6);
		}

		if (sps.sps_range_extension_flag) {
			// transform_skip_rotation_enabled_flag u(1)
			sps.transform_skip_rotation_enabled_flag = bitstream.getUnsigned(1);
			// transform_skip_context_enabled_flag u(1)
			sps.transform_skip_context_enabled_flag = bitstream.getUnsigned(1);
			// implicit_rdpcm_enabled_flag u(1)
			sps.implicit_rdpcm_enabled_flag = bitstream.getUnsigned(1);
			// explicit_rdpcm_enabled_flag u(1)
			sps.explicit_rdpcm_enabled_flag = bitstream.getUnsigned(1);
			// extended_precision_processing_flag u(1)
			sps.extended_precision_processing_flag = bitstream.getUnsigned(1);
			// intra_smoothing_disabled_flag u(1)
			sps.intra_smoothing_disabled_flag = bitstream.getUnsigned(1);
			// high_precision_offsets_enabled_flag u(1)
			sps.high_precision_offsets_enabled_flag = bitstream.getUnsigned(1);
			// persistent_rice_adaptation_enabled_flag u(1)
			sps.persistent_rice_adaptation_enabled_flag = bitstream.getUnsigned(1);
			// cabac_bypass_alignment_enabled_flag u(1)
			sps.cabac_bypass_alignment_enabled_flag = bitstream.getUnsigned(1);
		}	
	}
}

function buildBPG(sample) {
	var nalus = sample.description.hvcC.nalu_arrays;
	var sps;
	for (var i = 0; i < nalus.length; i++) {
		// Sequence parameter set
		if (nalus[i].nalu_type === 33) {
			console.log(nalus[i])
			// Extract the MP4 SPS from the NAL Units
			mp4_sps = read_sps_nalu_data(nalus[i][0].data)

		}
			
	}
}

/**************************** BGP ****************************/

// Construct a BPG from a a BGP bitstream
var BPG = function(bitStream) {

    this.file_size = bitStream.dataView.byteLength;
    this.file_magic = bitStream.dataView.getUnsigned(32);
    
    this.pixel_format = bitStream.dataView.getUnsigned(3);
    this.alpha1_flag = bitStream.dataView.getUnsigned(1);
    this.bit_depth_minus_8 = bitStream.dataView.getUnsigned(4);

    this.color_space = bitStream.dataView.getUnsigned(4);
    this.extension_present_flag = bitStream.dataView.getUnsigned(1);
    this.alpha2_flag = bitStream.dataView.getUnsigned(1);
    this.limited_range_flag = bitStream.dataView.getUnsigned(1);
    this.animation_flag = bitStream.dataView.getUnsigned(1);
     
    this.picture_width = bitStream.ue7nToNum();
    this.picture_height = bitStream.ue7nToNum();
     
    this.picture_data_length = bitStream.ue7nToNum();
     
    if (this.extension_present_flag) {  
        this.extension_data_length = bitStream.ue7nToNum();

        this.extension_tag = [];
        this.extension_tag_length = [];
        this.loop_count = [];
        this.frame_period_num = [];
        this.frame_period_den =[]; 
        for (var i = 0; i < this.extension_data_length; i++) {
	        this.extension_tag[i] = bitStream.ue7nToNum();
	        this.extension_tag_length[i] = bitStream.ue7nToNum();
	        
	        if (this.extension_tag === 5) {
	            this.loop_count[i] = bitStream.ue7nToNum();
			    this.frame_period_num[i] = bitStream.ue7nToNum();
			    this.frame_period_den[i] = bitStream.ue7nToNum();
			    this.dummy_byte = [];   
			    for (var j = 0; j < this.extension_data_length; j++)
			        this.dummy_byte[j] = bitStream.dataView.getUnsigned(8);
		    }
	        else {
	            this.extension_tag_data_byte = [];
	            for(var j = 0; j < this.extension_tag_length; j++)
	                this.extension_tag_data_byte[j] = bitStream.dataView.getUnsigned(8);
	        }
	    }
    }

    if (this.alpha1_flag || this.alpha2_flag) {
        this.header_transp = {};
        this.readHEVCHeader(this.header_transp, bitStream);
    }

    this.header = {};
    this.readHEVCHeader(this.header, bitStream);
    
    this.hevc_data_byte = [];
    for (var i = 0; bitStream.dataView._offset < bitStream.dataView.byteLength; i++) {
        this.hevc_data_byte[i] = bitStream.dataView.getUnsigned(8);
    }

    console.log("BPG loaded");
}

BPG.prototype.readHEVCHeader = function(header, bitStream) {
    header.hevc_header_length = bitStream.ue7nToNum();
    header.log2_min_luma_coding_block_size_minus3 = bitStream.expGolombToNum();
    header.log2_diff_max_min_luma_coding_block_size = bitStream.expGolombToNum();
    header.log2_min_transform_block_size_minus2 = bitStream.expGolombToNum();
    header.log2_diff_max_min_transform_block_size = bitStream.expGolombToNum();
    header.max_transform_hierarchy_depth_intra = bitStream.expGolombToNum();
    header.sample_adaptive_offset_enabled_flag = bitStream.dataView.getUnsigned(1);
    header.pcm_enabled_flag = bitStream.dataView.getUnsigned(1);

    if (header.pcm_enabled_flag) {
        header.pcm_sample_bit_depth_luma_minus1 = bitStream.dataView.dataView.getUnsigned(4);
        header.pcm_sample_bit_depth_chroma_minus1 = bitStream.dataView.getUnsigned(4);
        header.log2_min_pcm_luma_coding_block_size_minus3 = bitStream.expGolombToNum();
        header.log2_diff_max_min_pcm_luma_coding_block_size = bitStream.expGolombToNum();
        header.pcm_loop_filter_disabled_flag = bitStream.dataView.getUnsigned(1);
    }
    header.strong_intra_smoothing_enabled_flag = bitStream.dataView.getUnsigned(1);
    header.sps_extension_present_flag = bitStream.dataView.getUnsigned(1);
    if (header.sps_extension_present_flag) {
        header.sps_range_extension_flag = bitStream.dataView.getUnsigned(1);
        header.sps_extension_7bits = bitStream.dataView.getUnsigned(7);
    }
    if (header.sps_range_extension_flag) {
        header.transform_skip_rotation_enabled_flag = bitStream.dataView.getUnsigned(1);
        header.transform_skip_context_enabled_flag = bitStream.dataView.getUnsigned(1);
        header.implicit_rdpcm_enabled_flag = bitStream.dataView.getUnsigned(1);
        header.explicit_rdpcm_enabled_flag = bitStream.dataView.getUnsigned(1);
        header.extended_precision_processing_flag = bitStream.dataView.getUnsigned(1);
        header.intra_smoothing_disabled_flag = bitStream.dataView.getUnsigned(1);
        header.high_precision_offsets_enabled_flag = bitStream.dataView.getUnsigned(1);
        header.persistent_rice_adaptation_enabled_flag = bitStream.dataView.getUnsigned(1);
        header.cabac_bypass_alignment_enabled_flag = bitStream.dataView.getUnsigned(1);
    }

    header.trailing_bits = 0;
    while (bitStream.dataView._bitOffset < 0) {
        header.trailing_bits++;
        bitStream.dataView.getUnsigned(1);
    }
}

BPG.prototype.writeHEVCHeader = function(header, bitStream) {
    bitStream.numToue7n(header.hevc_header_length);
    bitStream.numToExpGolomb(header.log2_min_luma_coding_block_size_minus3);
    bitStream.numToExpGolomb(header.log2_diff_max_min_luma_coding_block_size);
    bitStream.numToExpGolomb(header.log2_min_transform_block_size_minus2);
    bitStream.numToExpGolomb(header.log2_diff_max_min_transform_block_size);
    bitStream.numToExpGolomb(header.max_transform_hierarchy_depth_intra);
    bitStream.dataView.writeUnsigned(header.sample_adaptive_offset_enabled_flag, 1);
    bitStream.dataView.writeUnsigned(header.pcm_enabled_flag, 1);

    if (header.pcm_enabled_flag) {
    	bitStream.dataView.writeUnsigned(header.pcm_sample_bit_depth_luma_minus1, 4);
    	bitStream.dataView.writeUnsigned(header.pcm_sample_bit_depth_chroma_minus1, 4);
    	bitStream.numToExpGolomb(header.log2_min_pcm_luma_coding_block_size_minus3);
    	bitStream.numToExpGolomb(header.log2_diff_max_min_pcm_luma_coding_block_size);
    	bitStream.dataView.writeUnsigned(header.pcm_loop_filter_disabled_flag, 1);
    }
    	bitStream.dataView.writeUnsigned(header.strong_intra_smoothing_enabled_flag, 1);
    	bitStream.dataView.writeUnsigned(header.sps_extension_present_flag, 1);
    if (header.sps_extension_present_flag) {
    	bitStream.dataView.writeUnsigned(header.sps_range_extension_flag, 1);
    	bitStream.dataView.writeUnsigned(header.sps_extension_7bits, 1);
    }
    if (header.sps_range_extension_flag) {
    	bitStream.dataView.writeUnsigned(header.transform_skip_rotation_enabled_flag, 1);
    	bitStream.dataView.writeUnsigned(header.transform_skip_context_enabled_flag, 1);
    	bitStream.dataView.writeUnsigned(header.implicit_rdpcm_enabled_flag, 1);
    	bitStream.dataView.writeUnsigned(header.explicit_rdpcm_enabled_flag, 1);
    	bitStream.dataView.writeUnsigned(header.extended_precision_processing_flag, 1);
    	bitStream.dataView.writeUnsigned(header.intra_smoothing_disabled_flag, 1);
    	bitStream.dataView.writeUnsigned(header.high_precision_offsets_enabled_flag, 1);
    	bitStream.dataView.writeUnsigned(header.persistent_rice_adaptation_enabled_flag, 1);
    	bitStream.dataView.writeUnsigned(header.cabac_bypass_alignment_enabled_flag, 1);
    }

    for (var i = 0; i < header.trailing_bits; i++)
    	bitStream.dataView.writeUnsigned(0, 1);
}

// Saves the BPG in a .BPG file
BPG.prototype.toFile = function(fileName) {
    var arrayBuffer = new ArrayBuffer(this.file_size);
    var bitStream = new BitStream(arrayBuffer);

    bitStream.dataView.writeUnsigned(this.file_magic, 32);

    bitStream.dataView.writeUnsigned(this.pixel_format, 3);
    bitStream.dataView.writeUnsigned(this.alpha1_flag, 1);
    bitStream.dataView.writeUnsigned(this.bit_depth_minus_8, 4);

    bitStream.dataView.writeUnsigned(this.color_space, 4);
    bitStream.dataView.writeUnsigned(this.extension_present_flag, 1);
    bitStream.dataView.writeUnsigned(this.alpha2_flag, 1);
    bitStream.dataView.writeUnsigned(this.limited_range_flag, 1);
    bitStream.dataView.writeUnsigned(this.animation_flag, 1);    

    bitStream.numToue7n(this.picture_width);
    bitStream.numToue7n(this.picture_height);
     
    bitStream.numToue7n(this.picture_data_length);
     
    if (this.extension_present_flag) {  
    	bitStream.numToue7n(this.extension_data_length);

	    for (var i = 0; i < this.extension_data_length; i++) {
	    	bitStream.numToue7n(this.extension_tag[i]);
	        bitStream.numToue7n(this.extension_tag_length[i]);
	        
	        if (this.extension_tag === 5) {
	        	bitStream.numToue7n(this.loop_count[i]);
	            bitStream.numToue7n(this.frame_period_num[i]);	
	            bitStream.numToue7n(this.frame_period_den[i]);	
			    for (var j = 0; j < this.extension_data_length; j++)
			    	bitStream.dataView.writeUnsigned(this.dummy_byte[j], 8);
			}
	        else
	            for(var j = 0; j < this.extension_tag_length; j++)
	            	bitStream.dataView.writeUnsigned(this.extension_tag_data_byte[j], 8);
	    }
    }

    if (this.alpha1_flag || this.alpha2_flag)
        this.writeHEVCHeader(this.header_transp, bitStream);

    this.writeHEVCHeader(this.header, bitStream);
    
    for (var i = 0; i < this.hevc_data_byte.length; i++)
    	bitStream.dataView.writeUnsigned(this.hevc_data_byte[i], 8);

    saveData(arrayBuffer, fileName);
    console.log("BPG saved");

}

/**************************** BitStream ****************************/

var BitStream = function(arrayBuffer) {
    this.dataView = new jDataView(arrayBuffer);

    this.avcGolombBits = [
    8, 7, 6, 6, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 3,
    3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
    2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0
    ];
}

// Function that encodes a number into a Exp-Golomb code (unsigned order k=0)
BitStream.prototype.numToExpGolomb = function(num) {
    var length = 1;
    var temp = ++num;

    while (temp != 1) {
        temp >>= 1;
        length += 2;
    }

    //console.log(length >> 1,", ",(length+1) >> 1);
    
    this.dataView.writeUnsigned(0, length >> 1)
    this.dataView.writeUnsigned(num, (length+1) >> 1)
}

// Function that decodes a Exp-Golomb code (unsigned order k=0) on the stream into a number
BitStream.prototype.expGolombToNum = function() {
    var coded;
    var bits = 0;
    var read;
    var endTest;
    var oldPos;
    var res;

    while (1) {
        oldPos = this.dataView.tell();
        read = this.dataView.getUnsigned(8);
        this.dataView.seek(oldPos);
        if (read != 0) break;
        //check whether we still have bits once the peek is done since we may have less than 8 bits available
        try {
            this.dataView.getUnsigned(8);
            bits += 8;
        }
        catch (e) {
            if (e instanceof RangeError) {
                console.log("[AVC/HEVC] Not enough bits in bitstream !!");
                return 0;
            }
        }
    }
    coded = this.avcGolombBits[read];
    this.dataView.getUnsigned(coded);
    bits += coded + 1;
    res = this.dataView.getUnsigned(bits);
    return (res - 1);
}

// Function that decodes a ue7(n) code on the stream into a number
BitStream.prototype.ue7nToNum = function() {
    var res = 0;
    var num;
    var initBit = 1;

    for (var i = 0; initBit; i++) {
        initBit = this.dataView.getUnsigned(1);
        num = this.dataView.getUnsigned(7);
        res = (res * Math.pow(2, 7)) + num;
    }

    return res;
}

// Function that encodes a number into a ue7(n) code on the stream
BitStream.prototype.numToue7n = function(num) {
    var numBitsInit = num.toString(2).length;
    var numBytesFinal = Math.ceil(numBitsInit/7);
    var res = 0;
    var mask7bits = 127; // 7 bits '1' 

    for (var i = 0; i < numBytesFinal; i++) {
        res += (num & mask7bits) << (8 * i);
        num >>= 7;
        if (i > 0)
            res += Math.pow(2, (8 * i) + 7);
    }

    this.dataView.writeUnsigned(res, numBytesFinal*8);
}


/**************************** Support functions ****************************/

function saveData(arrayBuffer, fileName) {
    var blob = new Blob([arrayBuffer]);
    var URL = (window.webkitURL || window.URL);
    if (URL && URL.createObjectURL) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', fileName);
        a.click();
        URL.revokeObjectURL(url);
    } else {
        throw("DataStream.save: Can't create object URL.");
    }
}

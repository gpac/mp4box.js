var hevcURL = "http://download.tsi.telecom-paristech.fr/gpac/dataset/dash/uhd/mux_sources/hevcds_720p30_2M.mp4";


/* Setting the level of logs (error, warning, info, debug) */
Log.setLogLevel(Log.d);

/* The main object processing the mp4 files */
var mp4box;

/* object responsible for file downloading */
var downloader;

window.onload = function () {
	load();
	// var buffer = new ArrayBuffer(10000000);
    //var arr = new Uint8Array(buffer);
	// var bitstream1 = new BitStream(buffer);
	// var bitstream2 = new BitStream(buffer);
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
	
	// for (var i = 0; i < 1000000; i++)
	// 	bitstream1.numToue7n(i);

	// var new_res;
	// var res;
	// for (var i = 0; i < 1000000; i++) {
	// 	new_res = bitstream2.ue7nToNum();
	// 	if (res !== new_res - 1 && new_res !== 0)
	// 		throw("erro");
	// 	res = new_res;
	// }
	
	/***********************************/
	/* Load a BPG image and read its syntax */

	// var fileInput = document.getElementById('fileInput');

	// fileInput.addEventListener('change',
	// 	function(e) {
	// 		var file = fileInput.files[0];
	// 		var fileReader = new FileReader();

	// 		fileReader.onload =
	// 			function(e) {
	// 				var arrayBufferRead = fileReader.result;
	// 				console.log("Start reading the BPG");
 //                    var bitStreamRead = new BitStream(arrayBufferRead);
	// 			    var bpg = new BPG(bitStreamRead);
	// 			    console.log("Start saving the BPG");
 //                    bpg.toFile("image.bpg");
	// 			}
	// 		fileReader.readAsArrayBuffer(file);	
	// 	}
	// ); 	
}     
var done = false;

function load() {

	mp4box = new MP4Box();
	mp4box.onMoovStart = function () {
		Log.i("Application", "Starting to parse movie information");
	}
	mp4box.onReady = function (info) {
		Log.i("Application", "Movie information received");
		movieInfo = info;
		mp4box.setExtractionOptions(2, null, { nbSamples: 1 });
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
				if (!done) {			
					extractBPG(sample);
					done = true;
				}
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

/**************************** MP4HEVC ****************************/

// Construct a MP4HEV
var MP4HEVC = function() {
	// Sequence Parameter Set
	this.SPS = {};
	// Picture Parameter Set
	this.PPS = null;
	// Video Coding Layer
	// Supplemental Enhancement Information
	this.data = null;
	// Width
	this.width = null;
	// Height
	this.height = null;
}	

// Function that reads the SPS NAL Unit of a MP4(HEVC), decode and stock them in a structure
MP4HEVC.prototype.readSPS = function (nalu) {
	var numBytes;

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
						if (scaling_list_pred_mode_flag[sizeId] == undefined)
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
		var num_negative_pics;
		var num_positive_pics;
		var used_by_curr_pic_flag;
		for (i = 0; i < num_short_term_ref_pic_sets; i++) {
			//*********** st_ref_pic_set(i)

			inter_ref_pic_set_prediction_flag = 0;
			if (i)
				// inter_ref_pic_set_prediction_flag u(1)
				inter_ref_pic_set_prediction_flag = bitStreamRead.dataView.getUnsigned(1);
			
			if (inter_ref_pic_set_prediction_flag) {
				if (i === num_short_term_ref_pic_sets)
					// delta_idx_minus1 ue(v)
					bitStreamRead.expGolombToNum();

				// delta_rps_sign u(1)
				bitStreamRead.dataView.getUnsigned(1);
				// abs_delta_rps_minus1 ue(v)
				bitStreamRead.expGolombToNum();
				// for( j = 0; j <= NumDeltaPocs[ RefRpsIdx ] = 0 ; j++ ) { 
				
				// used_by_curr_pic_flag u(1)
				used_by_curr_pic_flag =	bitStreamRead.dataView.getUnsigned(1);
				if (!used_by_curr_pic_flag)
					// use_delta_flag
					bitStreamRead.dataView.getUnsigned(1);
			}
			else {
				// num_negative_pics ue(v)
				num_negative_pics = bitStreamRead.expGolombToNum();
				// num_positive_pics ue(v)
				num_positive_pics = bitStreamRead.expGolombToNum();
				for (var i = 0; i < num_negative_pics; i++) {
					// delta_poc_s0_minus1[i] ue(v)
					bitStreamRead.expGolombToNum();
					// used_by_curr_pic_s0_flag[i] u(1)
					bitStreamRead.dataView.getUnsigned(1);
				}
				for (var i = 0; i < num_positive_pics; i++) {
					// delta_poc_s1_minus1[i] ue(v)
					bitStreamRead.expGolombToNum();
					// used_by_curr_pic_s1_flag[i] u(1)
					bitStreamRead.dataView.getUnsigned(1);
				}
			}

			//*********** st_ref_pic_set(i)
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
					bitStreamRead.skip(2);
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
MP4HEVC.prototype.removeEmulationBytes = function(nalu) {

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
MP4HEVC.prototype.readData = function(data, headerLength) {
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

MP4HEVC.prototype.toBPG = function(fileSize) {
    var bpg = new BPG();

    bpg.file_size = fileSize;

    bpg.file_magic = 0x425047fb;
    
    bpg.pixel_format = this.SPS.chroma_format_idc;
    bpg.alpha1_flag = 0;
    if (this.SPS.bit_depth_luma_minus8 === this.SPS.bit_depth_chroma_minus8)
    	bpg.bit_depth_minus_8 = this.SPS.bit_depth_chroma_minus8;
    else
    	throw ("Could not extract image");

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

    bpg.header.hevc_header_length = fileSize; // ceil
    bpg.header.log2_min_luma_coding_block_size_minus3 = this.SPS. log2_min_luma_coding_block_size_minus3;
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

/**************************** BGP ****************************/



// Construct a BPG from a a BGP bitstream
var BPG = function(bitStream) {

	if (bitStream === undefined)
		return this;
	else {
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

	        // extension_data
	        this.extension_tag = [];
	        this.extension_tag_length = [];
	        this.loop_count = [];
	        this.frame_period_num = [];
	        this.frame_period_den = []; 
	        this.dummy_byte = [];
	        this.extension_tag_data_byte = [];
	        for (var i = 0; i < this.extension_data_length; i++) {
		        this.extension_tag[i] = bitStream.ue7nToNum();
		        this.extension_tag_length[i] = bitStream.ue7nToNum();
		        
		        if (this.extension_tag[i] === 5) {
		        	// animation_control_extension
		            this.loop_count[i] = bitStream.ue7nToNum();
				    this.frame_period_num[i] = bitStream.ue7nToNum();
				    this.frame_period_den[i] = bitStream.ue7nToNum();
				    this.dummy_byte[i] = [];   
				    for (var j = 0; j < this.extension_tag_length[i]; j++)
				        this.dummy_byte[i][j] = bitStream.dataView.getUnsigned(8);
				    // animation_control_extension
			    }
		        else {
		            this.extension_tag_data_byte[i] = [];
		            for(var j = 0; j < this.extension_tag_length[i]; j++)
		                this.extension_tag_data_byte[i][j] = bitStream.dataView.getUnsigned(8);
		        }
		    }
		    // extension_data
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
        header.pcm_sample_bit_depth_luma_minus1 = bitStream.dataView.getUnsigned(4);
        header.pcm_sample_bit_depth_chroma_minus1 = bitStream.dataView.getUnsigned(4);
        header.log2_min_pcm_luma_coding_block_size_minus3 = bitStream.expGolombToNum();
        header.log2_diff_max_min_pcm_luma_coding_block_size = bitStream.expGolombToNum();
        header.pcm_loop_filter_disabled_flag = bitStream.dataView.getUnsigned(1);
    }
    header.strong_intra_smoothing_enabled_flag = bitStream.dataView.getUnsigned(1);
    header.sps_extension_present_flag = bitStream.dataView.getUnsigned(1);
    header.sps_range_extension_flag = 0;
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

BPG.prototype.writeHEVCHeader = function(header, bitStreamFile) {
	var arrayBufferHeader = new ArrayBuffer(header.hevc_header_length);
    var bitStreamHeaderWrite = new BitStream(arrayBufferHeader);
    var bitStreamHeaderRead = new BitStream(arrayBufferHeader);

    bitStreamHeaderWrite.numToExpGolomb(header.log2_min_luma_coding_block_size_minus3);
    bitStreamHeaderWrite.numToExpGolomb(header.log2_diff_max_min_luma_coding_block_size);
    bitStreamHeaderWrite.numToExpGolomb(header.log2_min_transform_block_size_minus2);
    bitStreamHeaderWrite.numToExpGolomb(header.log2_diff_max_min_transform_block_size);
    bitStreamHeaderWrite.numToExpGolomb(header.max_transform_hierarchy_depth_intra);
    bitStreamHeaderWrite.dataView.writeUnsigned(header.sample_adaptive_offset_enabled_flag, 1);
    bitStreamHeaderWrite.dataView.writeUnsigned(header.pcm_enabled_flag, 1);

    if (header.pcm_enabled_flag) {
    	bitStreamHeaderWrite.dataView.writeUnsigned(header.pcm_sample_bit_depth_luma_minus1, 4);
    	bitStreamHeaderWrite.dataView.writeUnsigned(header.pcm_sample_bit_depth_chroma_minus1, 4);
    	bitStreamHeaderWrite.numToExpGolomb(header.log2_min_pcm_luma_coding_block_size_minus3);
    	bitStreamHeaderWrite.numToExpGolomb(header.log2_diff_max_min_pcm_luma_coding_block_size);
    	bitStreamHeaderWrite.dataView.writeUnsigned(header.pcm_loop_filter_disabled_flag, 1);
    }
    bitStreamHeaderWrite.dataView.writeUnsigned(header.strong_intra_smoothing_enabled_flag, 1);
	bitStreamHeaderWrite.dataView.writeUnsigned(header.sps_extension_present_flag, 1);
    if (header.sps_extension_present_flag) {
    	bitStreamHeaderWrite.dataView.writeUnsigned(header.sps_range_extension_flag, 1);
    	bitStreamHeaderWrite.dataView.writeUnsigned(header.sps_extension_7bits, 7);
    }
    if (header.sps_range_extension_flag) {
    	bitStreamHeaderWrite.dataView.writeUnsigned(header.transform_skip_rotation_enabled_flag, 1);
    	bitStreamHeaderWrite.dataView.writeUnsigned(header.transform_skip_context_enabled_flag, 1);
    	bitStreamHeaderWrite.dataView.writeUnsigned(header.implicit_rdpcm_enabled_flag, 1);
    	bitStreamHeaderWrite.dataView.writeUnsigned(header.explicit_rdpcm_enabled_flag, 1);
    	bitStreamHeaderWrite.dataView.writeUnsigned(header.extended_precision_processing_flag, 1);
    	bitStreamHeaderWrite.dataView.writeUnsigned(header.intra_smoothing_disabled_flag, 1);
    	bitStreamHeaderWrite.dataView.writeUnsigned(header.high_precision_offsets_enabled_flag, 1);
    	bitStreamHeaderWrite.dataView.writeUnsigned(header.persistent_rice_adaptation_enabled_flag, 1);
    	bitStreamHeaderWrite.dataView.writeUnsigned(header.cabac_bypass_alignment_enabled_flag, 1);
    }

    // trailing_bits
    while (bitStreamHeaderWrite.dataView._bitOffset < 0)
        bitStreamHeaderWrite.dataView.writeUnsigned(0, 1);

    // CONFIRM IF BYTELENGTH IS THE AMOUNT WRITEN
    bitStreamFile.numToue7n(bitStreamHeaderWrite.dataView._offset);
    for (var i = 0; i < bitStreamHeaderWrite.dataView._offset; i++)
    	bitStreamFile.dataView.writeUnsigned(bitStreamHeaderRead.dataView.getUnsigned(8), 8);

    // for (var i = 0; i < header.trailing_bits; i++)
    // 	bitStreamHeader.dataView.writeUnsigned(0, 1);
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
	        
	        if (this.extension_tag[i] === 5) {
	        	bitStream.numToue7n(this.loop_count[i]);
	            bitStream.numToue7n(this.frame_period_num[i]);	
	            bitStream.numToue7n(this.frame_period_den[i]);	
			    for (var j = 0; j < this.extension_tag_length[i]; j++)
			    	bitStream.dataView.writeUnsigned(this.dummy_byte[i][j], 8);
			}
	        else
	            for(var j = 0; j < this.extension_tag_length[i]; j++)
	            	bitStream.dataView.writeUnsigned(this.extension_tag_data_byte[i][j], 8);
	    }
    }

    if (this.alpha1_flag || this.alpha2_flag)
        this.writeHEVCHeader(this.header_transp, bitStream);

    this.writeHEVCHeader(this.header, bitStream);
    
    for (var i = 0; i < this.hevc_data_byte.length; i++)
    	bitStream.dataView.writeUnsigned(this.hevc_data_byte[i], 8);

    // Save
    saveData(arrayBuffer, fileName);
    console.log("BPG saved");

    // Visualisation
    canvas = document.getElementById("mycanvas");
    canvas.width = this.picture_width;
    canvas.height = this.picture_height;
    showBPG(arrayBuffer);
    
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
BitStream.prototype.expGolombToNum = function(numBits) {
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
    numBits = bits;
    coded = this.avcGolombBits[read];
    this.dataView.getUnsigned(coded);
    numBits += coded;
    bits += coded + 1;
    res = this.dataView.getUnsigned(bits);
    numBits += bits;
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
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else {
        throw("DataStream.save: Can't create object URL.");

    }
}

function showBPG(arrayBuffer) {
	console.log("Showing BPG");

	var blob = new Blob([arrayBuffer]);
	var URL = (window.webkitURL || window.URL);
	var img, canvas, ctx;
    if (URL && URL.createObjectURL) {
        var url = URL.createObjectURL(blob);
    	
    	canvas = document.getElementById("mycanvas");
    	ctx = canvas.getContext("2d");

    	img = new BPGDecoder(ctx);
    	img.onload = function() {
        	/* draw the image to the canvas */
        	ctx.putImageData(this.imageData, 0, 0);
    	};
    	img.load(url);
    } else {
        throw("DataStream.save: Can't create object URL.");
	}
}

// Extract information from the MP4HEVC from the NAL Units
function extractBPG(sample) {
	var mp4NALUSHead = sample.description.hvcC.nalu_arrays;
	var mp4NALUSData = sample.data;
	var mp4hevc = new MP4HEVC();
	mp4hevc.width = sample.description.width;
	mp4hevc.height = sample.description.height;
	
	for (var i = 0; i < mp4NALUSHead.length; i++) {
		// Sequence Parameter Set
		if (mp4NALUSHead[i].nalu_type === 33)
			mp4hevc.readSPS(mp4NALUSHead[i][0].data);
		// Picture Parameter Set
		if (mp4NALUSHead[i].nalu_type === 34)
			mp4hevc.PPS = mp4NALUSHead[i][0].data;
	}
	// Video Coding Layer and Supplemental Enhancement Information
	// Read mp4NALUSData removing the Starting Length from each NALU and inserting a Starting Code
	mp4hevc.readData(mp4NALUSData, sample.description.hvcC.lengthSizeMinusOne + 1);

	// Create BPG
	var BPG = mp4hevc.toBPG(sample.size + sample.description.hvcC.size);

	BPG.toFile();
}	

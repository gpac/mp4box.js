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
					var arrayBuffer = fileReader.result;
					var bitStream = new jDataView(arrayBuffer);
				    var bpg = read_bpg(bitStream)
				    write_bpg(bpg);
				}
			fileReader.readAsArrayBuffer(file);	
		}
	); 
	
}

function write_bpg (bpg) {
	

/*	document.getElementById('bpg').innerHTML += bpg.file_magic.toString(16);

	
	bpg.pixel_format = bitStream.getUnsigned(3);
	bpg.alpha1_flag = bitStream.getUnsigned(1);
    bpg.bit_depth_minus_8 = bitStream.getUnsigned(4);

    bpg.color_space = bitStream.getUnsigned(4);
    bpg.extension_present_flag = bitStream.getUnsigned(1);
    bpg.alpha2_flag = bitStream.getUnsigned(1);
    bpg.limited_range_flag = bitStream.getUnsigned(1);
    bpg.animation_flag = bitStream.getUnsigned(1);
     
    bpg.picture_width = bitstream_get_ue7(bitStream);
    bpg.picture_height = bitstream_get_ue7(bitStream);
    
     
    bpg.picture_data_length = bitstream_get_ue7(bitStream);
     
    if (bpg.extension_present_flag) {  
        bpg.extension_data_length = bitstream_get_ue7(bitStream);

        bpg.extension_tag = [];
        bpg.extension_tag_length = [];
        bpg.loop_count = [];
        bpg.frame_period_num = [];
        bpg.frame_period_den =[];
        
        // *********** extension_data()
		
		for (var i = 0; i < bpg.extension_data_length; i++) {
			bpg.extension_tag[i] = bitstream_get_ue7(bitStream);
			bpg.extension_tag_length[i] = bitstream_get_ue7(bitStream);
			
			if (bpg.extension_tag === 5) {
	             
	            // *********** animation_control_extension(extension_tag_length)

	            bpg.loop_count[i] = bitstream_get_ue7(bitStream);
	            bpg.frame_period_num[i] = bitstream_get_ue7(bitStream);
	            bpg.frame_period_den[i] = bitstream_get_ue7(bitStream);
	            bpg.dummy_byte = [];   
	            for (var j = 0; j < bpg.extension_data_length; j++)
	            	bpg.dummy_byte[j] = bitStream.getUnsigned(8);

	             // *********** animation_control_extension(extension_tag_length)

	        } else {
	        	bpg.extension_tag_data_byte = [];
	            for(var j = 0; j < bpg.extension_tag_length; j++)
	                bpg.extension_tag_data_byte[j] = bitStream.getUnsigned(8);
	        }
        }

        // *********** extension_data()
    }

    // *********** hevc_header_and_data()

    if (bpg.alpha1_flag || bpg.alpha2_flag) {
        // *********** hevc_header() : transparent

		bpg.hevc_header_length_transp = bitstream_get_ue7(bitStream);
		bpg.log2_min_luma_coding_block_size_minus3_transp = bitstream_get_ue(bitStream);
		bpg.log2_diff_max_min_luma_coding_block_size_transp = bitstream_get_ue7(bitStream);
		bpg.log2_min_transform_block_size_minus2_transp = bitstream_get_ue7(bitStream);
		bpg.log2_diff_max_min_transform_block_size_transp = bitstream_get_ue7(bitStream);
		bpg.max_transform_hierarchy_depth_intra_transp = bitstream_get_ue7(bitStream);
		bpg.sample_adaptive_offset_enabled_flag_transp = bitStream.getUnsigned(1);
		bpg.pcm_enabled_flag_transp = bitStream.getUnsigned(1);
    
    	if (bpg.pcm_enabled_flag_transp) {
        	bpg.pcm_sample_bit_depth_luma_minus1_transp = bitStream.getUnsigned(4);
         	bpg.pcm_sample_bit_depth_chroma_minus1_transp = bitStream.getUnsigned(4);
         	bpglog2_min_pcm_luma_coding_block_size_minus3_transp = bitstream_get_ue(bitStream);
         	bpg.log2_diff_max_min_pcm_luma_coding_block_size_transp = bitstream_get_ue(bitStream);
         	bpg.pcm_loop_filter_disabled_flag_transp = bitStream.getUnsigned(1);
     	}
    	bpg.strong_intra_smoothing_enabled_flag_transp = bitStream.getUnsigned(1);
     	bpg.sps_extension_present_flag_transp = bitStream.getUnsigned(1);
     	if (bpg.sps_extension_present_flag_transp) {
         	bpg.sps_range_extension_flag_transp = bitStream.getUnsigned(1);
         	bpg.sps_extension_7bits_transp = bitStream.getUnsigned(7);
     	}
     	if (bpg.sps_range_extension_flag_transp) {
         	bpg.transform_skip_rotation_enabled_flag_transp = bitStream.getUnsigned(1);
         	bpg.transform_skip_context_enabled_flag_transp = bitStream.getUnsigned(1);
         	bpg.implicit_rdpcm_enabled_flag_transp = bitStream.getUnsigned(1);
        	bpg.explicit_rdpcm_enabled_flag_transp = bitStream.getUnsigned(1);
	        bpg.extended_precision_processing_flag_transp = bitStream.getUnsigned(1);
	        bpg.intra_smoothing_disabled_flag_transp = bitStream.getUnsigned(1);
	        bpg.high_precision_offsets_enabled_flag_transp = bitStream.getUnsigned(1);
	        bpg.persistent_rice_adaptation_enabled_flag_transp = bitStream.getUnsigned(1);
	        bpg.cabac_bypass_alignment_enabled_flag_transp = bitStream.getUnsigned(1);
     	}

     	bpg.trailing_bits_transp = 0;
     	while (bitStream._bitOffset < 0) {
     		bpg.trailing_bits_transp++;
     		bitStream.getUnsigned(1);
     	}

		// *********** hevc_header() : transparent        
    }

    // *********** hevc_header()

    bpg.hevc_header_length = bitstream_get_ue7(bitStream);
	bpg.log2_min_luma_coding_block_size_minus3 = bitstream_get_ue(bitStream);
	bpg.log2_diff_max_min_luma_coding_block_size = bitstream_get_ue7(bitStream);
	bpg.log2_min_transform_block_size_minus2 = bitstream_get_ue7(bitStream);
	bpg.log2_diff_max_min_transform_block_size = bitstream_get_ue7(bitStream);
	bpg.max_transform_hierarchy_depth_intra = bitstream_get_ue7(bitStream);
	bpg.sample_adaptive_offset_enabled_flag = bitStream.getUnsigned(1);
	bpg.pcm_enabled_flag = bitStream.getUnsigned(1);

	if (bpg.pcm_enabled_flag) {
    	bpg.pcm_sample_bit_depth_luma_minus1 = bitStream.getUnsigned(4);
     	bpg.pcm_sample_bit_depth_chroma_minus1 = bitStream.getUnsigned(4);
     	bpglog2_min_pcm_luma_coding_block_size_minus3 = bitstream_get_ue(bitStream);
     	bpg.log2_diff_max_min_pcm_luma_coding_block_size = bitstream_get_ue(bitStream);
     	bpg.pcm_loop_filter_disabled_flag = bitStream.getUnsigned(1);
 	}
	bpg.strong_intra_smoothing_enabled_flag = bitStream.getUnsigned(1);
 	bpg.sps_extension_present_flag = bitStream.getUnsigned(1);
 	if (bpg.sps_extension_present_flag) {
     	bpg.sps_range_extension_flag = bitStream.getUnsigned(1);
     	bpg.sps_extension_7bits = bitStream.getUnsigned(7);
 	}
 	if (bpg.sps_range_extension_flag) {
     	bpg.transform_skip_rotation_enabled_flag = bitStream.getUnsigned(1);
     	bpg.transform_skip_context_enabled_flag = bitStream.getUnsigned(1);
     	bpg.implicit_rdpcm_enabled_flag = bitStream.getUnsigned(1);
    	bpg.explicit_rdpcm_enabled_flag = bitStream.getUnsigned(1);
        bpg.extended_precision_processing_flag = bitStream.getUnsigned(1);
        bpg.intra_smoothing_disabled_flag = bitStream.getUnsigned(1);
        bpg.high_precision_offsets_enabled_flag = bitStream.getUnsigned(1);
        bpg.persistent_rice_adaptation_enabled_flag = bitStream.getUnsigned(1);
        bpg.cabac_bypass_alignment_enabled_flag = bitStream.getUnsigned(1);
 	}

 	bpg.trailing_bits = 0;
 	while (bitStream._bitOffset < 0) {
 		bpg.trailing_bits++;
 		bitStream.getUnsigned(1);
    }

    // *********** hevc_header()

    
    // *********** hevc_data()
    
    bpg.hevc_data_byte = [];
    for (var i = 0; i < bpg.picture_data_length; i++)
		bpg.hevc_data_byte[i] = bitStream.getUnsigned(8);

    // *********** hevc_data()
*/
}

// Function that reads each field of BPG format
function read_bpg (bitStream) {
	var bpg = {};

	// *********** heic_file()

	bpg.file_magic = bitStream.getUnsigned(32);
	
	bpg.pixel_format = bitStream.getUnsigned(3);
	bpg.alpha1_flag = bitStream.getUnsigned(1);
    bpg.bit_depth_minus_8 = bitStream.getUnsigned(4);

    bpg.color_space = bitStream.getUnsigned(4);
    bpg.extension_present_flag = bitStream.getUnsigned(1);
    bpg.alpha2_flag = bitStream.getUnsigned(1);
    bpg.limited_range_flag = bitStream.getUnsigned(1);
    bpg.animation_flag = bitStream.getUnsigned(1);
     
    bpg.picture_width = bitstream_get_ue7(bitStream);
    bpg.picture_height = bitstream_get_ue7(bitStream);
     
    bpg.picture_data_length = bitstream_get_ue7(bitStream);
     
    if (bpg.extension_present_flag) {  
        bpg.extension_data_length = bitstream_get_ue7(bitStream);

        bpg.extension_tag = [];
        bpg.extension_tag_length = [];
        bpg.loop_count = [];
        bpg.frame_period_num = [];
        bpg.frame_period_den =[];
        
        // *********** extension_data()
		
		for (var i = 0; i < bpg.extension_data_length; i++) {
			bpg.extension_tag[i] = bitstream_get_ue7(bitStream);
			bpg.extension_tag_length[i] = bitstream_get_ue7(bitStream);
			
			if (bpg.extension_tag === 5) {
	             
	            // *********** animation_control_extension(extension_tag_length)

	            bpg.loop_count[i] = bitstream_get_ue7(bitStream);
	            bpg.frame_period_num[i] = bitstream_get_ue7(bitStream);
	            bpg.frame_period_den[i] = bitstream_get_ue7(bitStream);
	            bpg.dummy_byte = [];   
	            for (var j = 0; j < bpg.extension_data_length; j++)
	            	bpg.dummy_byte[j] = bitStream.getUnsigned(8);

	             // *********** animation_control_extension(extension_tag_length)

	        } else {
	        	bpg.extension_tag_data_byte = [];
	            for(var j = 0; j < bpg.extension_tag_length; j++)
	                bpg.extension_tag_data_byte[j] = bitStream.getUnsigned(8);
	        }
        }

        // *********** extension_data()
    }

    // *********** hevc_header_and_data()

    if (bpg.alpha1_flag || bpg.alpha2_flag) {
        // *********** hevc_header() : transparent

		bpg.hevc_header_length_transp = bitstream_get_ue7(bitStream);
		bpg.log2_min_luma_coding_block_size_minus3_transp = bitstream_get_ue(bitStream);
		bpg.log2_diff_max_min_luma_coding_block_size_transp = bitstream_get_ue7(bitStream);
		bpg.log2_min_transform_block_size_minus2_transp = bitstream_get_ue7(bitStream);
		bpg.log2_diff_max_min_transform_block_size_transp = bitstream_get_ue7(bitStream);
		bpg.max_transform_hierarchy_depth_intra_transp = bitstream_get_ue7(bitStream);
		bpg.sample_adaptive_offset_enabled_flag_transp = bitStream.getUnsigned(1);
		bpg.pcm_enabled_flag_transp = bitStream.getUnsigned(1);
    
    	if (bpg.pcm_enabled_flag_transp) {
        	bpg.pcm_sample_bit_depth_luma_minus1_transp = bitStream.getUnsigned(4);
         	bpg.pcm_sample_bit_depth_chroma_minus1_transp = bitStream.getUnsigned(4);
         	bpglog2_min_pcm_luma_coding_block_size_minus3_transp = bitstream_get_ue(bitStream);
         	bpg.log2_diff_max_min_pcm_luma_coding_block_size_transp = bitstream_get_ue(bitStream);
         	bpg.pcm_loop_filter_disabled_flag_transp = bitStream.getUnsigned(1);
     	}
    	bpg.strong_intra_smoothing_enabled_flag_transp = bitStream.getUnsigned(1);
     	bpg.sps_extension_present_flag_transp = bitStream.getUnsigned(1);
     	if (bpg.sps_extension_present_flag_transp) {
         	bpg.sps_range_extension_flag_transp = bitStream.getUnsigned(1);
         	bpg.sps_extension_7bits_transp = bitStream.getUnsigned(7);
     	}
     	if (bpg.sps_range_extension_flag_transp) {
         	bpg.transform_skip_rotation_enabled_flag_transp = bitStream.getUnsigned(1);
         	bpg.transform_skip_context_enabled_flag_transp = bitStream.getUnsigned(1);
         	bpg.implicit_rdpcm_enabled_flag_transp = bitStream.getUnsigned(1);
        	bpg.explicit_rdpcm_enabled_flag_transp = bitStream.getUnsigned(1);
	        bpg.extended_precision_processing_flag_transp = bitStream.getUnsigned(1);
	        bpg.intra_smoothing_disabled_flag_transp = bitStream.getUnsigned(1);
	        bpg.high_precision_offsets_enabled_flag_transp = bitStream.getUnsigned(1);
	        bpg.persistent_rice_adaptation_enabled_flag_transp = bitStream.getUnsigned(1);
	        bpg.cabac_bypass_alignment_enabled_flag_transp = bitStream.getUnsigned(1);
     	}

     	bpg.trailing_bits_transp = 0;
     	while (bitStream._bitOffset < 0) {
     		bpg.trailing_bits_transp++;
     		bitStream.getUnsigned(1);
     	}

		// *********** hevc_header() : transparent        
    }

    // *********** hevc_header()

    bpg.hevc_header_length = bitstream_get_ue7(bitStream);
	bpg.log2_min_luma_coding_block_size_minus3 = bitstream_get_ue(bitStream);
	bpg.log2_diff_max_min_luma_coding_block_size = bitstream_get_ue7(bitStream);
	bpg.log2_min_transform_block_size_minus2 = bitstream_get_ue7(bitStream);
	bpg.log2_diff_max_min_transform_block_size = bitstream_get_ue7(bitStream);
	bpg.max_transform_hierarchy_depth_intra = bitstream_get_ue7(bitStream);
	bpg.sample_adaptive_offset_enabled_flag = bitStream.getUnsigned(1);
	bpg.pcm_enabled_flag = bitStream.getUnsigned(1);

	if (bpg.pcm_enabled_flag) {
    	bpg.pcm_sample_bit_depth_luma_minus1 = bitStream.getUnsigned(4);
     	bpg.pcm_sample_bit_depth_chroma_minus1 = bitStream.getUnsigned(4);
     	bpglog2_min_pcm_luma_coding_block_size_minus3 = bitstream_get_ue(bitStream);
     	bpg.log2_diff_max_min_pcm_luma_coding_block_size = bitstream_get_ue(bitStream);
     	bpg.pcm_loop_filter_disabled_flag = bitStream.getUnsigned(1);
 	}
	bpg.strong_intra_smoothing_enabled_flag = bitStream.getUnsigned(1);
 	bpg.sps_extension_present_flag = bitStream.getUnsigned(1);
 	if (bpg.sps_extension_present_flag) {
     	bpg.sps_range_extension_flag = bitStream.getUnsigned(1);
     	bpg.sps_extension_7bits = bitStream.getUnsigned(7);
 	}
 	if (bpg.sps_range_extension_flag) {
     	bpg.transform_skip_rotation_enabled_flag = bitStream.getUnsigned(1);
     	bpg.transform_skip_context_enabled_flag = bitStream.getUnsigned(1);
     	bpg.implicit_rdpcm_enabled_flag = bitStream.getUnsigned(1);
    	bpg.explicit_rdpcm_enabled_flag = bitStream.getUnsigned(1);
        bpg.extended_precision_processing_flag = bitStream.getUnsigned(1);
        bpg.intra_smoothing_disabled_flag = bitStream.getUnsigned(1);
        bpg.high_precision_offsets_enabled_flag = bitStream.getUnsigned(1);
        bpg.persistent_rice_adaptation_enabled_flag = bitStream.getUnsigned(1);
        bpg.cabac_bypass_alignment_enabled_flag = bitStream.getUnsigned(1);
 	}

 	bpg.trailing_bits = 0;
 	while (bitStream._bitOffset < 0) {
 		bpg.trailing_bits++;
 		bitStream.getUnsigned(1);
    }

    // *********** hevc_header()

    
    // *********** hevc_data()
    
    bpg.hevc_data_byte = [];
    while (bitStream._offset <= bitStream.byteLength) {
		bpg.hevc_data_byte[i] = bitStream.getUnsigned(8);
    }

    // *********** hevc_data()

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

/*******************************************************************/

var avc_golomb_bits = [
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

// Function that decodes a ue7(n) code on the stream into a number
function bitstream_get_ue7(bitStream) {
	var res = 0;
	var num;
	var initBit = 1;

	for (var i = 0; initBit; i++) {
		initBit = bitStream.getUnsigned(1);
		num = bitStream.getUnsigned(7);
		res = (res*Math.pow(2, i*7))+num;
	}

	return res;
}

// Function that decodes a Exp-Golomb code (unsigned order k=0) on the stream into a number
function bitstream_get_ue(bitstream) {
	var coded;
	var bits = 0;
	var read;
	var endTest;
	var oldPos;
	var res;

	while (1) {
		oldPos = bitstream.tell();
		read = bitstream.getUnsigned(8);
		bitstream.seek(oldPos);
		if (read != 0) break;
		//check whether we still have bits once the peek is done since we may have less than 8 bits available
		try {
  			bitstream.getUnsigned(8);
  			bits += 8;
		}
		catch (e) {
  			if (e instanceof RangeError) {
    			console.log("[AVC/HEVC] Not enough bits in bitstream !!");
    			return 0;
  			}
		}
	}
	coded = avc_golomb_bits[read];
	bitstream.getUnsigned(coded);
	bits += coded + 1;
	res = bitstream.getUnsigned(bits);
	return (res - 1);
}

// Function that encodes a number into a Exp-Golomb code (unsigned order k=0)
function num_set_ue (num, bitstream) {
	var length = 1;
  	var temp = ++num;

  	while (temp != 1) {
    	temp >>= 1;
    	length += 2;
  	}

  	//console.log(length >> 1,", ",(length+1) >> 1);
  	
  	bitstream.writeUnsigned(0, length >> 1)
	bitstream.writeUnsigned(num, (length+1) >> 1)
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


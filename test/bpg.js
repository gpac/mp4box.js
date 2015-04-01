/* MP4box/BPG 
 * 2015 - Wesley Marques Dias
 * BPG
 */

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

// Read the header fields from a BitStream
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

// Write the header fields in a BitStream
BPG.prototype.writeHEVCHeader = function(header, bitStream) {
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

    // Write the length followed by the header data
    bitStream.numToue7n(bitStreamHeaderWrite.dataView._offset);
    for (var i = 0; i < bitStreamHeaderWrite.dataView._offset; i++)
    	bitStream.dataView.writeUnsigned(bitStreamHeaderRead.dataView.getUnsigned(8), 8);
}

//  Write the BPG in a BitStream
BPG.prototype.toBitStream = function() {
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

    return bitStream;
}

// Show the BPG in a canvas using the BPGDecoder
BPG.prototype.show = function() {
    console.log("Showing BPG");

    var bitStream = this.toBitStream();

    if (bitStream) {

        canvas = document.getElementById("canvas");
        canvas.width = this.picture_width;
        canvas.height = this.picture_height;

        var blob = new Blob([bitStream.dataView.buffer]);
        var URL = (window.webkitURL || window.URL);
        var img, canvas, ctx;
        if (URL && URL.createObjectURL) {
            var url = URL.createObjectURL(blob);
            
            canvas = document.getElementById("canvas");
            ctx = canvas.getContext("2d");

            ctx.fillStyle="red";
            ctx.fillRect(0,0,canvas.width,canvas.height);

            img = new BPGDecoder(ctx);
            img.onload = function() {
                /* draw the image to the canvas */
                ctx.putImageData(this.imageData, 0, 0);
            };
            img.load(url);
        }
        else {
            throw("BPG.show(): Can't create object URL.");
        }
    }
    else {
        throw("BPG.show(): empty BPG.");
    }
}
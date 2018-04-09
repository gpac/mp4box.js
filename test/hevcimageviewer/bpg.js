if (typeof require !== "undefined") {
    var GolombBitStream = require('./golomb.js');
    var NALUFrame = require('./naluframe.js');
    var HEVCFrame = require('./hevcframe.js');
} 

var BPG = function() {
}

BPG.prototype.read = function (arrayBuffer, dts) {
    var bitStream = new GolombBitStream(arrayBuffer);
    this.file_size = bitStream.dataView.byteLength;
    this.dts = dts || 0; // Time in the timeline in case of an image extraction
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
        var extensionBytesRead, animationBytesRead;
        for (i = 0; i < this.extension_data_length; i += extensionBytesRead + j) {
            extensionBytesRead = bitStream.dataView._offset;
	        this.extension_tag[i] = bitStream.ue7nToNum();
	        this.extension_tag_length[i] = bitStream.ue7nToNum();
            extensionBytesRead = bitStream.dataView._offset - extensionBytesRead;
	        
	        if (this.extension_tag[i] === 5) {
	        	// animation_control_extension
                animationBytesRead = bitStream.dataView._offset;
	            this.loop_count[i] = bitStream.ue7nToNum();
			    this.frame_period_num[i] = bitStream.ue7nToNum();
			    this.frame_period_den[i] = bitStream.ue7nToNum();
			    this.dummy_byte[i] = [];  
                animationBytesRead = bitStream.dataView._offset - animationBytesRead;
			    for (j = animationBytesRead; j < this.extension_tag_length[i]; j++)
			        this.dummy_byte[i][j] = bitStream.dataView.getUnsigned(8);
			    // animation_control_extension
		    }
	        else {
	            this.extension_tag_data_byte[i] = [];
	            for(j = 0; j < this.extension_tag_length[i]; j++)
	                this.extension_tag_data_byte[i][j] = bitStream.dataView.getUnsigned(8);
	        }
	    }
	    // extension_data
    }

    if (this.alpha1_flag || this.alpha2_flag) {
        this.header_transp = {};
        BPG.readHEVCinBPGHeader(this.header_transp, bitStream);
    }

    this.header = {};
    BPG.readHEVCinBPGHeader(this.header, bitStream);
    
    this.hevc_data_byte = [];
    for (i = 0; bitStream.dataView._offset < bitStream.dataView.byteLength; i++) {
        this.hevc_data_byte[i] = bitStream.dataView.getUnsigned(8);
    }
    this.frames = NALUFrame.parseFrames(this.hevc_data_byte, HEVCFrame);
}

BPG.prototype.readFromHEVC = function(hevcframe, fileSize, dts) {
    this.file_size = fileSize; // Just a ceil

    this.dts = dts || 0; // Time in the timeline in case of an image extraction

    this.file_magic = 0x425047fb;
    
    this.pixel_format = hevcframe.SPS.chroma_format_idc;
    this.alpha1_flag = 0; // ?
    if (hevcframe.SPS.bit_depth_luma_minus8 === hevcframe.SPS.bit_depth_chroma_minus8) {
        this.bit_depth_minus_8 = hevcframe.SPS.bit_depth_chroma_minus8;
    } else{
        throw ("Could not extract image.");
    }

    this.color_space = 0;
    this.extension_present_flag = 0;
    this.alpha2_flag = 0;
    this.limited_range_flag = 0;
    this.animation_flag = 0;
     
    this.picture_width = hevcframe.width
    this.picture_height = hevcframe.height
     
    // picture_data_length (we put 0 for the moment to go up to the end of file)  
    this.picture_data_length = 0;

    this.header = {};

    this.header.hevc_header_length = fileSize; // Just a ceil
    this.header.log2_min_luma_coding_block_size_minus3 = hevcframe.SPS.log2_min_luma_coding_block_size_minus3;
    this.header.log2_diff_max_min_luma_coding_block_size = hevcframe.SPS.log2_diff_max_min_luma_coding_block_size;
    this.header.log2_min_transform_block_size_minus2 = hevcframe.SPS.log2_min_transform_block_size_minus2;
    this.header.log2_diff_max_min_transform_block_size = hevcframe.SPS.log2_diff_max_min_transform_block_size;
    this.header.max_transform_hierarchy_depth_intra = hevcframe.SPS.max_transform_hierarchy_depth_intra;
    this.header.sample_adaptive_offset_enabled_flag = hevcframe.SPS.sample_adaptive_offset_enabled_flag;
    this.header.pcm_enabled_flag = hevcframe.SPS.pcm_enabled_flag;

    if (this.header.pcm_enabled_flag) {
        this.header.pcm_sample_bit_depth_luma_minus1 = hevcframe.SPS.pcm_sample_bit_depth_luma_minus1;
        this.header.pcm_sample_bit_depth_chroma_minus1 = hevcframe.SPS.pcm_sample_bit_depth_chroma_minus1;
        this.header.log2_min_pcm_luma_coding_block_size_minus3 = hevcframe.SPS.log2_min_pcm_luma_coding_block_size_minus3;
        this.header.log2_diff_max_min_pcm_luma_coding_block_size = hevcframe.SPS.log2_diff_max_min_pcm_luma_coding_block_size;
        this.header.pcm_loop_filter_disabled_flag = hevcframe.SPS.pcm_loop_filter_disabled_flag;
    }
    this.header.strong_intra_smoothing_enabled_flag = hevcframe.SPS.strong_intra_smoothing_enabled_flag;
    this.header.sps_extension_present_flag = hevcframe.SPS.sps_extension_present_flag;
    if (this.header.sps_extension_present_flag) {
        this.header.sps_range_extension_flag = hevcframe.SPS.sps_range_extension_flag;
        this.header.sps_extension_7bits = hevcframe.SPS.sps_extension_7bits;
    }
    if (hevcframe.SPS.sps_range_extension_flag) {
        this.header.transform_skip_rotation_enabled_flag = hevcframe.SPS.transform_skip_rotation_enabled_flag;
        this.header.transform_skip_context_enabled_flag = hevcframe.SPS.transform_skip_context_enabled_flag;
        this.header.implicit_rdpcm_enabled_flag = hevcframe.SPS.implicit_rdpcm_enabled_flag;
        this.header.explicit_rdpcm_enabled_flag = hevcframe.SPS.explicit_rdpcm_enabled_flag;
        this.header.extended_precision_processing_flag = hevcframe.SPS.extended_precision_processing_flag;
        this.header.intra_smoothing_disabled_flag = hevcframe.SPS.intra_smoothing_disabled_flag;
        this.header.high_precision_offsets_enabled_flag = hevcframe.SPS.high_precision_offsets_enabled_flag;
        this.header.persistent_rice_adaptation_enabled_flag = hevcframe.SPS.persistent_rice_adaptation_enabled_flag;
        this.header.cabac_bypass_alignment_enabled_flag = hevcframe.SPS.cabac_bypass_alignment_enabled_flag;
    }
    
    // PPS, VCL and SEI
    this.hevc_data_byte = [];
    var j = 0;
    var i;
    for (i = 0; i < hevcframe.PPS.length; i++, j++) {
        this.hevc_data_byte[j] = hevcframe.PPS[i];
    }
    for (i = 0; i < hevcframe.data.length; i++, j++) {
        this.hevc_data_byte[j] = hevcframe.data[i];
    }
    this.frames = NALUFrame.parseFrames(this.hevc_data_byte, HEVCFrame);
}

// Read the header fields from a BitStream
BPG.readHEVCinBPGHeader = function(header, bitStream) {
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
BPG.writeHEVCinBPGHeader = function(header, bitStream) {
	var i;
    var arrayBufferHeader = new ArrayBuffer(header.hevc_header_length);
    var bitStreamHeaderWrite = new GolombBitStream(arrayBufferHeader);
    var bitStreamHeaderRead = new GolombBitStream(arrayBufferHeader);

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
    for (i = 0; i < bitStreamHeaderWrite.dataView._offset; i++)
    	bitStream.dataView.writeUnsigned(bitStreamHeaderRead.dataView.getUnsigned(8), 8);
}

//  Write the BPG in a BitStream
BPG.prototype.toBitStream = function() {
    var i, j;
    var arrayBuffer = new ArrayBuffer(this.file_size);
    var bitStreamWrite = new GolombBitStream(arrayBuffer);
    var bitStreamRead = new GolombBitStream(arrayBuffer);

    bitStreamWrite.dataView.writeUnsigned(this.file_magic, 32);

    bitStreamWrite.dataView.writeUnsigned(this.pixel_format, 3);
    bitStreamWrite.dataView.writeUnsigned(this.alpha1_flag, 1);
    bitStreamWrite.dataView.writeUnsigned(this.bit_depth_minus_8, 4);

    bitStreamWrite.dataView.writeUnsigned(this.color_space, 4);
    bitStreamWrite.dataView.writeUnsigned(this.extension_present_flag, 1);
    bitStreamWrite.dataView.writeUnsigned(this.alpha2_flag, 1);
    bitStreamWrite.dataView.writeUnsigned(this.limited_range_flag, 1);
    bitStreamWrite.dataView.writeUnsigned(this.animation_flag, 1);    

    bitStreamWrite.numToue7n(this.picture_width);
    bitStreamWrite.numToue7n(this.picture_height);
     
    bitStreamWrite.numToue7n(this.picture_data_length);
     
    if (this.extension_present_flag) {  
    	bitStreamWrite.numToue7n(this.extension_data_length);

        var extensionBytesWritten, animationBytesWritten;
	    for (i = 0; i < this.extension_data_length; i += extensionBytesWritten + j) {
            extensionBytesWritten = bitStreamWrite.dataView._offset;
	    	bitStreamWrite.numToue7n(this.extension_tag[i]);
	        bitStreamWrite.numToue7n(this.extension_tag_length[i]);
            extensionBytesWritten = bitStreamWrite.dataView._offset - extensionBytesWritten;
	        
	        if (this.extension_tag[i] === 5) {
                animationBytesWritten = bitStreamWrite.dataView._offset;
	        	bitStreamWrite.numToue7n(this.loop_count[i]);
	            bitStreamWrite.numToue7n(this.frame_period_num[i]);	
	            bitStreamWrite.numToue7n(this.frame_period_den[i]);	
                animationBytesWritten = bitStreamWrite.dataView._offset - animationBytesWritten;
			    for (j = animationBytesWritten; j < this.extension_tag_length[i]; j++)
			    	bitStreamWrite.dataView.writeUnsigned(this.dummy_byte[i][j], 8);
			}
	        else
	            for(j = 0; j < this.extension_tag_length[i]; j++)
	            	bitStreamWrite.dataView.writeUnsigned(this.extension_tag_data_byte[i][j], 8);
	    }
    }

    if (this.alpha1_flag || this.alpha2_flag)
        BPG.writeHEVCinBPGHeader(this.header_transp, bitStreamWrite);

    BPG.writeHEVCinBPGHeader(this.header, bitStreamWrite);
    
    for (i = 0; i < this.hevc_data_byte.length; i++)
    	bitStreamWrite.dataView.writeUnsigned(this.hevc_data_byte[i], 8);

    // Final BitStream to write the right amount of data
    var arrayBufferFinal = new ArrayBuffer(bitStreamWrite.dataView._offset);
    var bitStreamFinal = new GolombBitStream(arrayBufferFinal);

    for (i = 0; i < bitStreamWrite.dataView._offset; i++)
        bitStreamFinal.dataView.writeUnsigned(bitStreamRead.dataView.getUnsigned(8), 8);

    return bitStreamFinal;
}

BPG.prototype.getHEVCSPS = function() {
    var sps = this.header;
    var cb_size = 1 << (this.header.log2_min_luma_coding_block_size_minus3+3);
    sps.pic_width_in_luma_samples = Math.ceil(this.picture_width/cb_size) * cb_size;
    sps.pic_height_in_luma_samples = Math.ceil(this.picture_height/cb_size) * cb_size;
    sps.chroma_format_idc = this.pixel_format;
    sps.bit_depth_luma_minus8 = this.bit_depth_minus_8;
    sps.bit_depth_chroma_minus8 = this.bit_depth_minus_8;
    sps.max_transform_hierarchy_depth_inter = sps.max_transform_hierarchy_depth_intra;
    return sps;
}

if (typeof exports !== 'undefined') {
    module.exports = BPG;  
}

/*
* Copyright (c) 2024. Paul Higgs
* License: BSD-3-Clause (see LICENSE file)
*/


function ReferencePictureSet(list, set) {
    this.list = list;
    this.set = set;
    this.pics = [];
}
ReferencePictureSet.prototype.set_reference_to_library_enable_flag = function(flag) {
    this.reference_to_library_enable_flag = flag;
};
ReferencePictureSet.prototype.push = function(pic) {
    this.pics.push(pic);
};
ReferencePictureSet.prototype.toString = function() {
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

function ReferencePictureList(list) {
    this.list = list;
    this.sets = [];
}
ReferencePictureList.prototype.push = function(set) {
    this.sets.push(set);
};
ReferencePictureList.prototype.toString = function() {
    if (this.sets.length == 0)
        return "(empty)";
    var l = [];
    this.sets.forEach( function(set) {
        l.push(set.toString());
    });
    return l.join(", ");
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
            this.WeightQuantMatrix4x4 = this_size;
        else 
            this.WeightQuantMatrix8x8 = this_size;
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



// AVS3 video configuration box
BoxParser.createBoxCtor("av3c", function(stream) {

    var BitBuffer = new phBitBuffer();
    var MAIN_8 = 0x20, MAIN_10 = 0x22, HIGH_8 = 0x30, HIGH_10 = 0x32;
    var AVS3profiles = [  // Table B.1 of T/AI 109.2
        {profile:MAIN_8,  description:"Main 8 bit"},
        {profile:MAIN_10, description:"Main 10 bit"},
        {profile:HIGH_8,  description:"High 8 bit"},
        {profile:HIGH_10, description:"High 10 bit"},
        {profile:0x00, description:"Forbidden"},
    ];
    var AVS3levels = [  // Table B.1 of T/AI 109.2
        {level:0x50, description:"8.0.30"},
        {level:0x52, description:"8.2.30"},
        {level:0x51, description:"8.4.30"},
        {level:0x53, description:"8.6.30"},
        {level:0x54, description:"8.0.60"},
        {level:0x56, description:"8.2.60"},
        {level:0x55, description:"8.4.60"},
        {level:0x57, description:"8.6.60"},
        {level:0x58, description:"8.0.120"},
        {level:0x5A, description:"8.2.120"},
        {level:0x59, description:"8.4.120"},
        {level:0x5B, description:"8.6.120"},
        {level:0x60, description:"10.0.30"},
        {level:0x62, description:"10.2.30"},
        {level:0x61, description:"10.4.30"},
        {level:0x63, description:"10.6.30"},
        {level:0x64, description:"10.0.60"},
        {level:0x66, description:"10.2.60"},
        {level:0x65, description:"10.4.60"},
        {level:0x67, description:"10.6.60"},
        {level:0x68, description:"10.0.120"},
        {level:0x6A, description:"10.2.120"},
        {level:0x69, description:"10.4.120"},
        {level:0x6B, description:"10.6.120"},
        {level:0x10, description:"2.0.15"},
        {level:0x12, description:"2.0.30"},
        {level:0x14, description:"2.0.60"},
        {level:0x20, description:"4.0.30"},
        {level:0x22, description:"4.0.60"},
        {level:0x40, description:"6.0.30"},
        {level:0x42, description:"6.2.30"},
        {level:0x41, description:"6.4.30"},
        {level:0x43, description:"6.6.30"},
        {level:0x44, description:"6.0.60"},
        {level:0x46, description:"6.2.60"},
        {level:0x45, description:"6.4.60"},
        {level:0x47, description:"6.6.60"},
        {level:0x48, description:"6.0.120"},
        {level:0x4A, description:"6.2.120"},
        {level:0x49, description:"6.4.120"},
        {level:0x4B, description:"6.6.120"},
        {level:0x00, description:"Forbidden"},
    ];
    var AVS3profile = function (profile) {
        var t = AVS3profiles.find(function (e) { return e.profile == profile; });
        return t == undefined ? "Reserved" : t.description;
    };
    var AVS3level = function (level) {
        var t = AVS3levels.find(function (e) { return e.level == level; });
        return t == undefined ? "Reserved" : t.description;
    };
    var se2value = function (codeNum) {
        return (Math.pow(-1, codeNum+1) * Math.ceil(codeNum/2));
    };

    this.configurationVersion = stream.readUint8();
    if (this.configurationVersion != 1) {
        Log.error("av3c version "+this.configurationVersion+" not supported");
        return;
    }
    var sequence_header_length = stream.readUint16();

    var i, j, buf=[];
    for (i=0; i<sequence_header_length; i++) {
        buf.push(stream.readUint8());
    }
    BitBuffer.load(buf, false);

    this.video_sequence_start_code = new HexadecimalValue(BitBuffer.getUint32());
    var profile_id = BitBuffer.getUint8();
    var level_id = BitBuffer.getUint8();
    this.profile_id = new HexadecimalValue(profile_id, AVS3profile(profile_id));
    this.level_id = new HexadecimalValue(level_id,  AVS3level(level_id));
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
    this.chroma_format = new BinaryValue(BitBuffer.getBits(2), 2);
    this.sample_precision = new BinaryValue(BitBuffer.getBits(3), 3);
    
    if (this.profile_id == MAIN_10 || this.profile_id == HIGH_10)
        this.encoding_precision = new BinaryValue(BitBuffer.getBits(3), 3);
    BitBuffer.skipBits(1);  // marker_bit

    this.aspect_ratio = new BinaryValue(BitBuffer.getBits(4), 4);
    this.frame_rate_code = new BinaryValue(BitBuffer.getBits(4), 4);
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
        var this_set = new ReferencePictureSet(list, rpls);
        if (this.library_picture_enable_flag)
        this_set.set_reference_to_library_enable_flag(BitBuffer.getBit());
        var num_of_ref_pic = BitBuffer.getUE();
        for (var i2=0; i2<num_of_ref_pic; i2++) {
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
            this_set.push(this_pic);
        }
        return this_set;
    };

    this.num_ref_pic_list_set0 = BitBuffer.getUE();
    this.rpl0 = new ReferencePictureList(0);
    for (j=0; j<this.num_ref_pic_list_set0; j++)
        this.rpl0.push(reference_picture_list(0, j));

    if (!this.rpl1_same_as_rpl0_flag) {
        this.num_ref_pic_list_set1 = BitBuffer.getUE();
        this.rpl1 = new ReferencePictureList(1);
        for (j=0; j<this.num_ref_pic_list_set1; j++)
            this.rpl1.push(reference_picture_list(1, j));
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

    // library_dependency_idc is in the AVS3DecoderConfigurationRecord
    this.library_dependency_idc = new BinaryValue(stream.readUint8(), 2);
});






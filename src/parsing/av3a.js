/*
* Copyright (c) 2024. Paul Higgs
* License: BSD-3-Clause (see LICENSE file)
*/

/*
//extension metadata is no longer carried in the track information

function ObjectExtensionMetadataBlock(BitBuffer) {

    var BitsInType = function (loudnessType) {
        if ([0,1,2,3,4,5,6,9].contains(loudnessType))
            return 8;
        else if (loudnessType == 7)
            return 5;
        else if (loudnessType == 8)
            return 2;
        return 0;
    }
    this.loudnessValDef = BitBuffer.getBits(4);
    this.loudnessVal = BitBuffer.getBits(BitsInType(this.loudnessValDef));
}

function ObjectExtensionMetadataBlock(BitBuffer) {
    this.maxObjChannelNum = BitBuffer.getUint8();
    var hasObjChannelLock = BitBuffer.getBool();
    if (hasObjChannelLock)
        this.objChannelLock_maxDist = BitBuffer.getBits(4);
    this.objDiffuse = BitBuffer.getBits(7);
    this.objGain = BitBuffer.getUint8();
    this.objDivergence = BitBuffer.getBits(4);
    if (this.objDivergence > 0)
        this.objDivergencePosRange = BitBuffer.getBits(4);
    BitBuffer.byte_alignment();
}

function LoudnessMetadataBlock(BitBuffer) {
    var hasSamplePeakLevel = BitBuffer.getBool();
    BitBuffer.skipBits(3);
    if (hasSamplePeakLevel) 
        this.samplePeakLevel = BitBuffer.getBits(12);
    this.truePeakLevel = BitBuffer.getBits(12);
    this.loudnessMeasure = BitBuffer.getBits(4);
    var loudnessValNum = BitBuffer.getBits(4);
    if (loudnessValNum > 0) {
        this.loudnessVal = [];
        for (var i=0; i<loudnessValNum; i++) {
            var lv = new LoudnessValue(BitBuffer);
            this.loudnessVal.push(lv);
        }
    }
    BitBuffer.byte_alignment();
}

function ANCData(BitBuffer) {
    this.anc_data_length = BitBuffer.getUint8();
    this.anc_data_number = BitBuffer.getBits(4);
    BitBuffer.skopBits(4);
    this.anc_blocks = [];
    for (var i=0; i< this.anc_data_number; i++) {
        var anc_data_type = BitBuffer.getBits(4);
        switch (anc_data_type) {
            case 1:
                var oem = new ObjectExtensionMetadataBlock(BitBuffer);
                this.anc_blocks.push(oem);
                break;
            case 2:
                var lm = new LoudnessMetadataBlock(BitBuffer);
                this.and_blocks.push(lm);
                break;
        }

    }
    BitBuffer.byte_alignment(); 
}
*/

function AVS3Acodec(codec_id) {
    var codecs = ["General High Rate", "Lossless", "General Full Rate"];
    return codec_id + " (" + (codec_id < codecs.length ? codecs[codec_id] : "undefined" ) + ")"
}

function parseCA3SpecificBox(BitBuffer) {
    this.data = {};
    this.data.audio_codec_id  = BitBuffer.getBits(4);
    this.data.audio_codec_id  = new HexadecimalValue(audio_codec_id, AVS3Acodec(audio_codec_id));
    switch (this.data.audio_codec_id) {
        case 2:
            // Avs3AudioGASpecificConfig()
            this.data.sampling_frequency_index = BitBuffer.getBits(4);
            this.data.nn_type = new DescribedValue(BitBuffer.getBits(3), AVS3nntype);
            BitBuffer.skipBits(1);
            this.data.content_type = BitBuffer.getBits(4);
            if (this.data.content_type == 0) {
                // channel based audio
                this.data.channel_number_index = BitBuffer.getBits(7);
                BitBuffer.skipBits(1);
            }
            else if (this.data.content_type == 1) {
                // object based audio
                this.data.num_objects = BitBuffer.getBits(7);
                BitBuffer.skipBits(1);
            }
            else if (this.data.content_type == 2) {
                // hybrid channel+object based audio
                this.data.channel_number_index = BitBuffer.getBits(7);
                BitBuffer.skipBits(1);
                this.data.num_objects = BitBuffer.getBits(7);
                BitBuffer.skipBits(1);
            }
            else if (this.data.content_type == 3) {
                // high order ambisonics
                this.data.hoa_order = BitBuffer.getBits(4);
            }
            this.data.total_bitrate = BitBuffer.getUint16()
            this.data.resolution = new DescribedValue(BitBuffer.getBits(2), AVS3resolution);
            break;
        case 0:
            // Avs3AudioGHSpecificConfig()
            this.data.sampling_frequency_index = BitBuffer.getBits(4);
            this.data.anc_data_index = BitBuffer.getBool();
            this.data.coding_profile = new DescribedValue(BitBuffer.getBits(3), AVS3codingprofile);
            this.data.bitstream_type = BitBuffer.getBit();
            this.data.channel_number_index = BitBuffer.getBits(7);
            this.data.bitrate_index = BitBuffer.getBits(4);
            this.data.raw_frame_length = BitBuffer.getUint16();
            this.data.resolution = new DescribedValue(BitBuffer.getBits(2), AVS3resolution);
            var addition_info_length1 = BitBuffer.getUint16();
            if (addition_info_length1 > 0) {
                this.data.addition_info = [];
                for (i=0; i<addition_info_length1; i++) 
                    this.data.addition_info.push(BitBuffer.getUint8());
            }
            break;
        case 1:
            // Avs3AudioLLSpecificConfig()
            this.data.sampling_frequency_index = BitBuffer.getBits(4);
            if (this.data.sampling_frequency_index == 0xF)
                this.data.sampling_frequency = BitBuffer.getUint24();
            this.data.anc_data_index = BitBuffer.getBool();
            this.data.coding_profile = new DescribedValue(BitBuffer.getBits(3), AVS3codingprofile);
            this.data.channel_number = BitBuffer.getUint8();
            this.data.resolution = new DescribedValue(BitBuffer.getBits(2), AVS3resolution);
            var addition_info_length2 = BitBuffer.getUint16();
            if (addition_info_length2 > 0) {
                this.data.addition_info = [];
                for (i=0; i<addition_info_length2; i++) 
                    this.data.addition_info.push(BitBuffer.getUint8());
            }
            break;
    }
    BitBuffer.byte_alignment();
}

function tabularize(data) {
    var res = "<table>";
    Object.getOwnPropertyNames(this.data).forEach(function (val, idx, array) {
        var fmt_val = "";
        if (Array.isArray(arg)) {
            for (var i = 0; i < val.length; i++) {
                var hex = val[i].toString(16);
                html += (hex.length === 1 ? "0"+hex : hex) ;
                if (i%4 === 3) html += ' ';
            }
        }
        else
            fmt_val = val;
        html += "<tr><td><code>" + val + "</code></td><td><code>" + this[val] + "</code></td></tr>";
    }); 
    return res + "</table>";
}

parseCA3SpecificBox.prototype.toHTML = function() {
    return tabularize(this.data);
};


var AVS3resolution = function(val) {
    switch (val) {
        case 0: return "8 bits/sample";
        case 1: return "16 bits/sample";
        case 2: return "24 bits/sample";
    }
    return "reserved";
}
var AVS3nntype = function(val) {
    switch (val) {
        case 0: return "basic neural network";
        case 1: return "low-complexity neural network";
    }
    return "reserved";
}
var AVS3codingprofile = function(val) {
    switch (val) {
        case 0: return "basic framework";
        case 1: return "object metadata framework";
        case 2: return "HOA data coding framework";
    }
    return "reserved";
}
var MakeFourCC = function(val) {
    return String.fromCharCode(val >> 24, (val & 0x00ff0000) >> 16, (val & 0x0000ff00) >> 8, val & 0x000000ff);
}

function parseAASFHeader(BitBuffer) {
    this.data = {};
    this.data.aasf_id = new DescribedValue(BitBuffer.getUint32(), MakeFourCC);
    this.data.header_size = BitBuffer.getUint24();
    this.data.raw_stream_length = BitBuffer.getUint32();
    this.data.audio_codec_id = BitBuffer.getBits(4);
    this.data.resolution = new DescribedValue(BitBuffer.getBits(2), AVS3resolution);
    if (this.data.audio_codec_id == 2) 
        this.data.nn_type = new DescribedValue(BitBuffer.getBits(3), AVS3nntype);
    this.data.coding_profile = new DescribedValue(BitBuffer.getBits(3), AVS3codingprofile);
    this.data.anc_data_index = BitBuffer.getBit();
    if (this.data.audio_codec_id == 0)
        this.data.channel_number_index = BitBuffer.getBits(7);
    if (this.data.audio_codec_id == 1) {
        this.data.channel_number = BitBuffer.getBits(4); 
        if (this.data.channel_number == 0xF)
            this.data.channel_number = 16 + BitBuffer.getBits(4);
    }
    if (this.data.audio_codec_id == 2) {
        if (this.data.coding_profile.get() == 0) {
            this.data.channel_number_index = BitBuffer.getBits(7);
        }
        if (this.data.coding_profile.get() == 1) {
            this.data.soundBedType = BitBuffer.getBits(2);
            if (this.data.soundBedType == 0) {
                this.data.object_channel_number = BitBuffer.getBits(7);
                this.data.bitrate_index_per_channel = BitBuffer.getBits(4);
            }
            else if (this.data.soundBedType == 1) {
                this.data.channel_number_index = BitBuffer.getBits(7);
                this.data.bitrate_index = BitBuffer.getBits(4);
                this.data.object_channel_number = BitBuffer.getBits(7);
                this.data.bitrate_index_per_channel = BitBuffer.getBits(4);
            }
        }
        if (this.data.coding_profile.get() == 2) {
            this.data.order = BitBuffer.getBits(7);
        }
    }
    this.data.sampling_frequency_index = BitBuffer.getBits(4);
    if (this.data.coding_profile.get() == 1) {
        if (this.data.sampling_frequency_index == 0xf) {
            this.data.sampling_frequency = BitBuffer.getUint24();
        }
    }
    if (this.data.audio_codec_id == 0 || (this.data.audio_codec_id ==2 && this.data.coding_profile.get() != 1)) {
        this.data.bitrate_index = BitBuffer.getBits(4);
    }
    if (this.data.audio_codec_id == 0) {
        this.data.bitstream_type = BitBuffer.getBit();
        if (this.data.channel_number == 2) {
            this.data.supermode_flag = BitBuffer.getBits(2);
            this.data.couple_channel_config = BitBuffer.getUint8();
        }
        if (this.data.channel_number > 2) {
            this.data.supermode_flag = BitBuffer.getBits(2);
            this.data.couple_channel_config = BitBuffer.getUint8();
            this.data.PCAGroupmodeHeader = BitBuffer.getUint8();
        }
    }
    BitBuffer.byte_alignment();
}
parseAASFHeader.prototype.toHTML = function() {
    return tabularize(this.data);
};

BoxParser.createBoxCtor("av3a", function(stream) {
    var BitBuffer = new phBitBuffer(stream);
    this.config = new parseCA3SpecificBox(BitBuffer);
});

BoxParser.createBoxCtor("a3as", function(stream) {
    var BitBuffer = new phBitBuffer(stream);
    this.config = new parseCA3SpecificBox(BitBuffer);
    BitBuffer.skipBits(16);   // avs3_as_header_length
    this.avs3_as_header = new parseAASFHeader(BitBuffer);
});


function parseAvs3AudioGASpecificConfig(BitBuffer) {
    this.data = {};
    this.data.sampling_frequency_index = BitBuffer.getBits(4);
    this.data.nn_type = new DescribedValue(BitBuffer.getBits(3), AVS3nntype);
    buf.skipBits(1);
    this.data.content_type = BitBuffer.getBits(4);
    if (this.data.content_type == 0) {
        this.data.channel_number_index = BitBuffer.getBits(7);
        BitBuffer.skipBits(1);
    }
    else if (this.data.content_type == 1) {
        this.data.num_objects = BitBuffer.getBits(7);
        BitBuffer.skipBits(1);
    }
    else if (this.data.content_type == 2) {
        this.data.channel_number_index = BitBuffer.getBits(7);
        BitBuffer.skipBits(1);
        this.data.num_objects = BitBuffer.getBits(7);
        BitBuffer.skipBits(1);
    }
    else if (this.data.content_type == 3) {
        this.data.hoa_order = BitBuffer.getBits(4);
    }
    this.data.total_bitrate = BitBuffer.getUint16();
    this.data.resolution = BitBuffer.getBits(2);
}
parseAvs3AudioGASpecificConfig.prototype.toHTML = function() {
    return tabularize(this.data);
};

function parseAvs3AudioGHSpecificConfig(BitBuffer) {
    this.data = {};
    this.data.sampling_frequency_index = BitBuffer.getBits(4);
    this.data.anc_data_index = BitBuffer.getBit();
    this.data.coding_profile = new DescribedValue(BitBuffer.getBits(3), AVS3codingprofile);
    this.data.bitstream_type = BitBuffer.getBits(1);
    this.data.channel_number_index = BitBuffer.getBits(7);
    this.data.bitrate_index = BitBuffer.getBits(4);
    this.data.raw_frame_length = BitBuffer.getUint16();
    this.data.resolution = new DescribedValue(BitBuffer.getBits(2), AVS3resolution);
    var addition_info_length = BitBuffer.getUint16();
    if (addition_info_length > 0) {
        this.data.addition_info=[];
        for (var i=0; i<addition_info_length; i++)
            this.data.addition_info.push(BitBuffer.getUint8());
    }
}
parseAvs3AudioGHSpecificConfig.prototype.toHTML = function() {
    return tabularize(this.data);
};

function parseAvs3AudioLLSpecificConfig(BitBuffer) {
    this.data = {};
    this.data.sampling_frequency_index = BitBuffer.getBits(4);
    if (this.data.sampling_frequency_index == 0xF)
        this.data.sampling_frequency = BitBuffer.getUint24();
    this.data.anc_data_index = BitBuffer.getBit();
    this.data.coding_profile = new DescribedValue(BitBuffer.getBits(3), AVS3codingprofile);
    this.data.channel_number = BitBuffer.getUint8();
    this.data.resolution = new DescribedValue(BitBuffer.getBits(2), AVS3resolution);
    var addition_info_length = BitBuffer.getUint16();
    if (addition_info_length > 0) {
        this.data.addition_info=[];
        for (var i=0; i<addition_info_length; i++)
            this.data.addition_info.push(BitBuffer.getUint8());
    }
    BitBuffer.skipBits(2); // reserved
    
}
parseAvs3AudioLLSpecificConfig.prototype.toHTML = function() {
    return tabularize(this.data);
};

BoxParser.createBoxCtor("dca3", function(stream) {
    var BitBuffer = new phBitBuffer(stream);
    this.audio_codec_id = BitBuffer.getBits(4);

    if (this.audio_codec_id == 2) {
        this.Avs3AudioGAConfig = new parseAvs3AudioGASpecificConfig(BitBuffer);
    }
    else if (this.audio_codec_id == 0) {
        this.Avs3AudioGHConfig = new parseAvs3AudioGHSpecificConfig(BitBuffer);
    }
    else if (this.audio_codec_id == 1) {
        this.Avs3AudioLLConfig = new parseAvs3AudioLLSpecificConfig(BitBuffer);
    }

    BitBuffer.byte_alignmentment();
});

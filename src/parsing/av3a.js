/*
* Copyright (c) 2024. Paul Higgs
* License: BSD-3-Clause (see LICENSE file)
*/

function AVS3Acodec(codec_id) {
    var codecs = ["General High Rate", "Lossless", "General Full Rate"];
    return codec_id < codecs.length ? codecs[codec_id] : "undefined";
}

function AVS3Achannel_number(channel_number_index) {
    var configs = ["Mono", "Stereo", "5.1", "7.1", "10.2", "22.2", "4.0/FOA", "5.1.2", "5.1.4", "7.1.2", "7.1.4", "3rd HOA", "2nd HOA"];
    return channel_number_index < configs.length ? configs[channel_number_index] : "undefined";
}

function AVS3Asampling_frequency(sampling_frequency_index) {
   var frequencies = [192000, 96000, 48000, 44100, 32000, 24000, 22050, 16000, 8000];
    return sampling_frequency_index < frequencies.length ? frequencies[sampling_frequency_index]+"Hz" : "reserved";
}

function AVS3Aresolution(resolution) {
    switch (resolution) {
        case 0: return "8 bits/sample";
        case 1: return "16 bits/sample";
        case 2: return "24 bits/sample";
    }
    return "reserved";
}

function AVS3Anntype(nn_type) {
    switch (nn_type) {
        case 0: return "basic neural network";
        case 1: return "low-complexity neural network";
    }
    return "reserved";
}

function AVS3Acodingprofile(conding_profile) {
    switch (conding_profile) {
        case 0: return "basic framework";
        case 1: return "object metadata framework";
        case 2: return "HOA data coding framework";
    }
    return "reserved";
}

function AVS3Atabularize(data) {
    var res = "";
    var props = Object.getOwnPropertyNames(data)
    if (props) props.forEach(function (val, idx, array) {
        var fmt_val = "";
        if (Array.isArray(data[val])) {
            for (var i = 0; i < data[val].length; i++) {
                var hex = data[val][i].toString(16);
                fmt_val += (hex.length === 1 ? "0"+hex : hex) ;
                if (i%4 === 3) fmt_val += ' ';
            }
        }
        else
            fmt_val = data[val];
        res += "<tr><td><code>" + val + "</code></td><td><code>" + fmt_val + "</code></td></tr>";
    }); 
    return "<table>" + res + "</table>";
}


/* TODO.AVS3A - activate whem test streams are available
var MakeFourCC = function(val) {
    return String.fromCharCode(val >> 24, (val & 0x00ff0000) >> 16, (val & 0x0000ff00) >> 8, val & 0x000000ff);
}

function parseCA3SpecificBox(stream) {
    var BitBuffer = new phBitBuffer();
    BitBuffer.appendUint8(stream.getUint8());

    this.data = {};
    audio_codec_id  = BitBuffer.getBits(4);
    this.data.audio_codec_id  = new DescribedValue(audio_codec_id, AVS3Acodec);
    switch (audio_codec_id) {
        case 2:
            // Avs3AudioGASpecificConfig()
            this.data.sampling_frequency_index = BitBuffer.getBits(4);
            BitBuffer.appendUint8(stream.getUint8());
            this.data.nn_type = new DescribedValue(BitBuffer.getBits(3), AVS3Anntype);
            BitBuffer.skipBits(1);
            this.data.content_type = BitBuffer.getBits(4);
            if (this.data.content_type == 0) {
                // channel based audio
                BitBuffer.appendUint8(stream.getUint8());
                this.data.channel_number_index = BitBuffer.getBits(7);
                BitBuffer.skipBits(1);
            }
            else if (this.data.content_type == 1) {
                // object based audio
                BitBuffer.appendUint8(stream.getUint8());
                this.data.num_objects = BitBuffer.getBits(7);
                BitBuffer.skipBits(1);
            }
            else if (this.data.content_type == 2) {
                // hybrid channel+object based audio
                BitBuffer.appendUint8(stream.getUint8());
                this.data.channel_number_index = BitBuffer.getBits(7);
                BitBuffer.skipBits(1);
                BitBuffer.appendUint8(stream.getUint8());
                this.data.num_objects = BitBuffer.getBits(7);
                BitBuffer.skipBits(1);
            }
            else if (this.data.content_type == 3) {
                // high order ambisonics
                BitBuffer.appendUint8(stream.getUint8());
                this.data.hoa_order = BitBuffer.getBits(4);
            }
            BitBuffer.appendUint8(stream.getUint8());
            BitBuffer.appendUint8(stream.getUint8());
            this.data.total_bitrate = BitBuffer.getUint16();
            if (this.data.content_type != 3)
                BitBuffer.appendUint8(stream.getUint8());
            this.data.resolution = new DescribedValue(BitBuffer.getBits(2), AVS3resolution);
            break;
        case 0:
            // Avs3AudioGHSpecificConfig()
            this.data.sampling_frequency_index = BitBuffer.getBits(4);
            BitBuffer.appendUint8(stream.getUint8());
            this.data.anc_data_index = BitBuffer.getBool();
            this.data.coding_profile = new DescribedValue(BitBuffer.getBits(3), AVS3codingprofile);
            this.data.bitstream_type = BitBuffer.getBit();
            BitBuffer.appendUint8(stream.getUint8());
            this.data.channel_number_index = BitBuffer.getBits(7);
            this.data.bitrate_index = BitBuffer.getBits(4);
            BitBuffer.appendUint8(stream.getUint8());
            BitBuffer.appendUint8(stream.getUint8());
            this.data.raw_frame_length = BitBuffer.getUint16();
            BitBuffer.appendUint8(stream.getUint8());
            this.data.resolution = new DescribedValue(BitBuffer.getBits(2), AVS3resolution);
            var addition_info_length1 = BitBuffer.getUint16();
            if (addition_info_length1 > 0) {
                this.data.addition_info = [];
                for (i=0; i<addition_info_length1; i++) {
                    BitBuffer.appendUint8(stream.getUint8());
                    this.data.addition_info.push(BitBuffer.getUint8());
                }
            }
            break;
        case 1:
            // Avs3AudioLLSpecificConfig()
            this.data.sampling_frequency_index = BitBuffer.getBits(4);
            if (this.data.sampling_frequency_index == 0xF) {
                for (var sf=0; sf<3; sf++) BitBuffer.appendUint8(stream.getUint8());
                this.data.sampling_frequency = BitBuffer.getUint24();
            }
            BitBuffer.appendUint8(stream.getUint8());
            this.data.anc_data_index = BitBuffer.getBool();
            this.data.coding_profile = new DescribedValue(BitBuffer.getBits(3), AVS3codingprofile);
            BitBuffer.appendUint8(stream.getUint8());
            this.data.channel_number = BitBuffer.getUint8();
            this.data.resolution = new DescribedValue(BitBuffer.getBits(2), AVS3resolution);
            BitBuffer.appendUint8(stream.getUint8());
            BitBuffer.appendUint8(stream.getUint8());
            var addition_info_length2 = BitBuffer.getUint16();
            if (addition_info_length2 > 0) {
                this.data.addition_info = [];
                for (i=0; i<addition_info_length2; i++) {
                    BitBuffer.appendUint8(stream.getUint8());
                    this.data.addition_info.push(BitBuffer.getUint8());
                }
            }
            break;
    }
//    BitBuffer.byte_alignment();
}
parseCA3SpecificBox.prototype.toHTML = function() {
    return AVS3Atabularize(this.data);
};
*/

/* TODO.AVS3A - activate whem test streams are available
function parseAASFHeader(BitBufferx) {
    var BitBuffer = new phBitBuffer();
    for (var i=0; i<2; i++) BitBuffer.appendUint8(stream.getUint8());
    BitBuffer.skipBits(16);   // avs3_as_header_length

    this.data = {};
    for (i=0; i<11; i++) BitBuffer.appendUint8(stream.getUint8());
    this.data.aasf_id = new DescribedValue(BitBuffer.getUint32(), MakeFourCC);
    this.data.header_size = BitBuffer.getUint24();
    this.data.raw_stream_length = BitBuffer.getUint32();
    BitBuffer.appendUint8(stream.getUint8());
    this.data.audio_codec_id = BitBuffer.getBits(4);
    this.data.resolution = new DescribedValue(BitBuffer.getBits(2), AVS3Aresolution);
    if (this.data.audio_codec_id == 2) {
        BitBuffer.appendUint8(stream.getUint8());
        this.data.nn_type = new DescribedValue(BitBuffer.getBits(3), AVS3Anntype);
    }
    this.data.coding_profile = new DescribedValue(BitBuffer.getBits(3), AVS3Acodingprofile);
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
    return AVS3Atabularize(this.data);
};
*/

/* TODO.AVS3A - activate whem test streams are available
BoxParser.createBoxCtor("av3a", function(stream) {
    this.config = new parseCA3SpecificBox(stream);
});

BoxParser.createBoxCtor("a3as", function(stream) {
    this.config = new parseCA3SpecificBox(stream);
    this.avs3_as_header = new parseAASFHeader(stream);
});
*/

function parseAvs3AudioGASpecificConfig(BitBuffer) {
    this.data = {};
    this.data.sampling_frequency_index = new DescribedValue(BitBuffer.getBits(4), AVS3Asampling_frequency);
    this.data.nn_type = new DescribedValue(BitBuffer.getBits(3), AVS3Anntype);
    BitBuffer.skipBits(1);
    this.data.content_type = BitBuffer.getBits(4);
    if (this.data.content_type == 0) {
        this.data.channel_number_index = new DescribedValue(BitBuffer.getBits(7), AVS3Achannel_number);
        BitBuffer.skipBits(1);
    }
    else if (this.data.content_type == 1) {
        this.data.num_objects = BitBuffer.getBits(7);
        BitBuffer.skipBits(1);
    }
    else if (this.data.content_type == 2) {
        this.data.channel_number_index = new DescribedValue(BitBuffer.getBits(7), AVS3Achannel_number);
        BitBuffer.skipBits(1);
        this.data.num_objects = BitBuffer.getBits(7);
        BitBuffer.skipBits(1);
    }
    else if (this.data.content_type == 3) {
        this.data.hoa_order = BitBuffer.getBits(4);
    }
    this.data.total_bitrate = BitBuffer.getUint16();
    this.data.resolution =  new DescribedValue(BitBuffer.getBits(2), AVS3Aresolution); 
}
parseAvs3AudioGASpecificConfig.prototype.toHTML = function() {
    return AVS3Atabularize(this.data);
};


function parseAvs3AudioGHSpecificConfig(BitBuffer) {
    this.data = {};
    this.data.sampling_frequency_index = BitBuffer.getBits(4);
    this.data.anc_data_index = BitBuffer.getBit();
    this.data.coding_profile = new DescribedValue(BitBuffer.getBits(3), AVS3Acodingprofile);
    this.data.bitstream_type = BitBuffer.getBits(1);
    this.data.channel_number_index = BitBuffer.getBits(7);
    this.data.bitrate_index = BitBuffer.getBits(4);
    this.data.raw_frame_length = BitBuffer.getUint16();
    this.data.resolution = new DescribedValue(BitBuffer.getBits(2), AVS3Aresolution);
    var addition_info_length = BitBuffer.getUint16();

    if (addition_info_length > 0) {
        this.data.addition_info=[];
        for (var i=0; i<addition_info_length; i++)
            this.data.addition_info.push(BitBuffer.getUint8());
    }
}
parseAvs3AudioGHSpecificConfig.prototype.toHTML = function() {
    return AVS3Atabularize(this.data);
};



function parseAvs3AudioLLSpecificConfig(BitBuffer) {
    this.data = {};
    this.data.sampling_frequency_index = BitBuffer.getBits(4);
    if (this.data.sampling_frequency_index == 0xF) 
        this.data.sampling_frequency = BitBuffer.getUint24();

    this.data.anc_data_index = BitBuffer.getBit();
    this.data.coding_profile = new DescribedValue(BitBuffer.getBits(3), AVS3Acodingprofile);
    this.data.channel_number = BitBuffer.getUint8();
    this.data.resolution = new DescribedValue(BitBuffer.getBits(2), AVS3Aresolution);
    var addition_info_length = BitBuffer.getUint16();
    if (addition_info_length > 0) {
        this.data.addition_info=[];
        for (var i=0; i<addition_info_length; i++)
            this.data.addition_info.push(BitBuffer.getUint8());
    }
    BitBuffer.skipBits(2); // reserved
}
parseAvs3AudioLLSpecificConfig.prototype.toHTML = function() {
    return AVS3Atabularize(this.data);
};


BoxParser.createBoxCtor("dca3", function(stream) {
    var BitBuffer = new phBitBuffer();
    var buf=[], boxBytes = this.size - this.hdr_size;
    for (var i=0; i<boxBytes; i++)
        BitBuffer.appendUint8(stream.readUint8());

    this.audio_codec_id = new DescribedValue(BitBuffer.getBits(4), AVS3Acodec);

    switch (this.audio_codec_id.get()) {
        case 2:
            this.Avs3AudioGAConfig = new parseAvs3AudioGASpecificConfig(BitBuffer);
            break;
        case 0:
            this.Avs3AudioGHConfig = new parseAvs3AudioGHSpecificConfig(BitBuffer);
            break;
        case 1:
            this.Avs3AudioLLConfig = new parseAvs3AudioLLSpecificConfig(BitBuffer);
            break;
    }
    BitBuffer.byte_alignment();
});


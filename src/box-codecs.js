BoxParser.SampleEntry.prototype.isVideo = function() {
	return false;
}

BoxParser.SampleEntry.prototype.isAudio = function() {
	return false;
}

BoxParser.SampleEntry.prototype.isSubtitle = function() {
	return false;
}

BoxParser.SampleEntry.prototype.isMetadata = function() {
	return false;
}

BoxParser.SampleEntry.prototype.isHint = function() {
	return false;
}

BoxParser.SampleEntry.prototype.getCodec = function() {
	return this.type.replace('.','');
}

BoxParser.SampleEntry.prototype.getWidth = function() {
	return "";
}

BoxParser.SampleEntry.prototype.getHeight = function() {
	return "";
}

BoxParser.SampleEntry.prototype.getChannelCount = function() {
	return "";
}

BoxParser.SampleEntry.prototype.getSampleRate = function() {
	return "";
}

BoxParser.SampleEntry.prototype.getSampleSize = function() {
	return "";
}

BoxParser.VisualSampleEntry.prototype.isVideo = function() {
	return true;
}

BoxParser.VisualSampleEntry.prototype.getWidth = function() {
	return this.width;
}

BoxParser.VisualSampleEntry.prototype.getHeight = function() {
	return this.height;
}

BoxParser.AudioSampleEntry.prototype.isAudio = function() {
	return true;
}

BoxParser.AudioSampleEntry.prototype.getChannelCount = function() {
	return this.channel_count;
}

BoxParser.AudioSampleEntry.prototype.getSampleRate = function() {
	return this.samplerate;
}

BoxParser.AudioSampleEntry.prototype.getSampleSize = function() {
	return this.samplesize;
}

BoxParser.SubtitleSampleEntry.prototype.isSubtitle = function() {
	return true;
}

BoxParser.MetadataSampleEntry.prototype.isMetadata = function() {
	return true;
}


BoxParser.decimalToHex = function(d, padding) {
	var hex = Number(d).toString(16);
	padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
	while (hex.length < padding) {
		hex = "0" + hex;
	}
	return hex;
}

BoxParser.avc1SampleEntry.prototype.getCodec =
BoxParser.avc2SampleEntry.prototype.getCodec =
BoxParser.avc3SampleEntry.prototype.getCodec =
BoxParser.avc4SampleEntry.prototype.getCodec = function() {
	var baseCodec = BoxParser.SampleEntry.prototype.getCodec.call(this);
	if (this.avcC) {
		return baseCodec+"."+BoxParser.decimalToHex(this.avcC.AVCProfileIndication)+
						  ""+BoxParser.decimalToHex(this.avcC.profile_compatibility)+
						  ""+BoxParser.decimalToHex(this.avcC.AVCLevelIndication);
	} else {
		return baseCodec;
	}
}

BoxParser.hev1SampleEntry.prototype.getCodec =
BoxParser.hvc1SampleEntry.prototype.getCodec = function() {
	var i;
	var baseCodec = BoxParser.SampleEntry.prototype.getCodec.call(this);
	if (this.hvcC) {
		baseCodec += '.';
		switch (this.hvcC.general_profile_space) {
			case 0:
				baseCodec += '';
				break;
			case 1:
				baseCodec += 'A';
				break;
			case 2:
				baseCodec += 'B';
				break;
			case 3:
				baseCodec += 'C';
				break;
		}
		baseCodec += this.hvcC.general_profile_idc;
		baseCodec += '.';
		var val = this.hvcC.general_profile_compatibility;
		var reversed = 0;
		for (i=0; i<32; i++) {
			reversed |= val & 1;
			if (i==31) break;
			reversed <<= 1;
			val >>=1;
		}
		baseCodec += BoxParser.decimalToHex(reversed, 0);
		baseCodec += '.';
		if (this.hvcC.general_tier_flag === 0) {
			baseCodec += 'L';
		} else {
			baseCodec += 'H';
		}
		baseCodec += this.hvcC.general_level_idc;
		var hasByte = false;
		var constraint_string = "";
		for (i = 5; i >= 0; i--) {
			if (this.hvcC.general_constraint_indicator[i] || hasByte) {
				constraint_string = "."+BoxParser.decimalToHex(this.hvcC.general_constraint_indicator[i], 0)+constraint_string;
				hasByte = true;
			}
		}
		baseCodec += constraint_string;
	}
	return baseCodec;
}

BoxParser.vvc1SampleEntry.prototype.getCodec =
BoxParser.vvi1SampleEntry.prototype.getCodec = function () {
	var i;
	var baseCodec = BoxParser.SampleEntry.prototype.getCodec.call(this);
	if (this.vvcC) {
		baseCodec += '.' + this.vvcC.general_profile_idc;
		if (this.vvcC.general_tier_flag) {
			baseCodec += '.H';
		} else {
			baseCodec += '.L';
		}
		baseCodec += this.vvcC.general_level_idc;

		var constraint_string = "";
		if (this.vvcC.general_constraint_info) {
			var bytes = [];
			var byte = 0;
			byte |= this.vvcC.ptl_frame_only_constraint << 7;
			byte |= this.vvcC.ptl_multilayer_enabled << 6;
			var last_nonzero;
			for (i = 0; i < this.vvcC.general_constraint_info.length; ++i) {
				byte |= (this.vvcC.general_constraint_info[i] >> 2) & 0x3f;
				bytes.push(byte);
				if (byte) {
					last_nonzero = i;
				}

				byte = (this.vvcC.general_constraint_info[i] >> 2) & 0x03;
			}

			if (last_nonzero === undefined) {
				constraint_string = ".CA";
			}
			else {
				constraint_string = ".C"
				var base32_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
				var held_bits = 0;
				var num_held_bits = 0;
				for (i = 0; i <= last_nonzero; ++i) {
					held_bits = (held_bits << 8) | bytes[i];
					num_held_bits += 8;

					while (num_held_bits >= 5) {
						var val = (held_bits >> (num_held_bits - 5)) & 0x1f;
						constraint_string += base32_chars[val];

						num_held_bits -= 5;
						held_bits &= (1 << num_held_bits) - 1;
					}
				}
				if (num_held_bits) {
					held_bits <<= (5 - num_held_bits);  // right-pad with zeros to 5 bits (is this correct?)
					constraint_string += base32_chars[held_bits & 0x1f];
				}
			}
		}
		baseCodec += constraint_string;
	}
	return baseCodec;
}

BoxParser.mp4aSampleEntry.prototype.getCodec = function() {
	var baseCodec = BoxParser.SampleEntry.prototype.getCodec.call(this);
	if (this.esds && this.esds.esd) {
		var oti = this.esds.esd.getOTI();
		var dsi = this.esds.esd.getAudioConfig();
		return baseCodec+"."+BoxParser.decimalToHex(oti)+(dsi ? "."+dsi: "");
	} else {
		return baseCodec;
	}
}

BoxParser.stxtSampleEntry.prototype.getCodec = function() {
	var baseCodec = BoxParser.SampleEntry.prototype.getCodec.call(this);
	if(this.mime_format) {
		return baseCodec + "." + this.mime_format;
	} else {
		return baseCodec
	}
}

BoxParser.vp08SampleEntry.prototype.getCodec =
BoxParser.vp09SampleEntry.prototype.getCodec = function() {
	var baseCodec = BoxParser.SampleEntry.prototype.getCodec.call(this);
	var level = this.vpcC.level;
	if (level == 0) {
		level = "00";
	}
	var bitDepth = this.vpcC.bitDepth;
	if (bitDepth == 8) {
		bitDepth = "08";
	}
	return baseCodec + ".0" + this.vpcC.profile + "." + level + "." + bitDepth;
}

BoxParser.av01SampleEntry.prototype.getCodec = function() {
	var baseCodec = BoxParser.SampleEntry.prototype.getCodec.call(this);
	var level = this.av1C.seq_level_idx_0;
	if (level < 10) {
		level = "0" + level;
	}
	var bitdepth;
	if (this.av1C.seq_profile === 2 && this.av1C.high_bitdepth === 1) {
		bitdepth = (this.av1C.twelve_bit === 1) ? "12" : "10";
	} else if ( this.av1C.seq_profile <= 2 ) {
		bitdepth = (this.av1C.high_bitdepth === 1) ? "10" : "08";
	}
	// TODO need to parse the SH to find color config
	return baseCodec+"."+this.av1C.seq_profile+"."+level+(this.av1C.seq_tier_0?"H":"M")+"."+bitdepth;//+"."+this.av1C.monochrome+"."+this.av1C.chroma_subsampling_x+""+this.av1C.chroma_subsampling_y+""+this.av1C.chroma_sample_position;
}

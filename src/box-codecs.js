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

BoxParser.avc1SampleEntry.prototype.getCodec = function() {
	var baseCodec = BoxParser.SampleEntry.prototype.getCodec.call(this);
	if (this.avcC) {
		return baseCodec+"."+BoxParser.decimalToHex(this.avcC.AVCProfileIndication)+
						  ""+BoxParser.decimalToHex(this.avcC.profile_compatibility)+
						  ""+BoxParser.decimalToHex(this.avcC.AVCLevelIndication);		
	} else {
		return baseCodec;
	}
}

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

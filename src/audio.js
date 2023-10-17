var AudioSpecificConfig = function() {};

AudioSpecificConfig.getAudioObjectType = function(stream) {
	var tmp = stream.readUint8();
	var audioObjectType = tmp >> 3;
	if (audioObjectType === 0x1F) {
		audioObjectType = 32;
		audioObjectType += tmp & 0x7;
		tmp = stream.readUint8();
		audioObjectType += tmp >> 2;
	}
	return audioObjectType;
}

AudioSpecificConfig.prototype.parse = function(stream, audioObjectType) {
	var tmp = stream.readUint8();
	this.samplingFrequencyIndex = tmp >> 4;
	if  (this.samplingFrequencyIndex === 0xF) {
		this.samplingFrequency = (tmp & 0xF) << 20;
		this.samplingFrequency += stream.readUint8() << 12;
		this.samplingFrequency += stream.readUint8() << 4;
		tmp = stream.readUint8();
		this.samplingFrequency += (tmp >> 4);
	}
	this.channelConfiguration = (tmp & 0xF);
	this.sbrPresentFlag = -1;
	this.psPresentFlag = -1;
	if (audioObjectType === 5 || audioObjectType === 29) {
		this.extensionAudioObjectType = 5;
		this.sbrPresentFlag = 1;
		if (audioObjectType === 29) {
			this.psPresentFlag = 1;
		}
		tmp = stream.readUint8();
		this.extensionSamplingFrequencyIndex = tmp >> 4;
		if (this.extensionSamplingFrequencyIndex === 0xF) {
			this.extensionSamplingFrequencyIndex = (tmp & 0xF) << 20;
			this.extensionSamplingFrequencyIndex += stream.readUint8() << 12;
			this.extensionSamplingFrequencyIndex += stream.readUint8() << 4;
			tmp = stream.readUint8();
			this.extensionSamplingFrequencyIndex += (tmp >> 4);
		}
	}
}

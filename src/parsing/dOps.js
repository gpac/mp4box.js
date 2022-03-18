BoxParser.createBoxCtor("dOps", function(stream) {
	this.Version = stream.readUint8();
	this.OutputChannelCount = stream.readUint8();
	this.PreSkip = stream.readUint16();
	this.InputSampleRate = stream.readUint32();
	this.OutputGain = stream.readInt16();
	this.ChannelMappingFamily = stream.readUint8();
	if (this.ChannelMappingFamily !== 0) {
		this.StreamCount = stream.readUint8();
		this.CoupledCount = stream.readUint8();
		this.ChannelMapping = [];
		for (var i = 0; i < this.OutputChannelCount; i++) {
			this.ChannelMapping[i] = stream.readUint8();
		}
	}
});


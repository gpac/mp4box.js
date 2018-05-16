BoxParser.createUUIDBox("a2394f525a9b4f14a2446c427c648df4", true, false /*, function(stream) {
	if (this.flags & 0x1) {
		this.AlgorithmID = stream.readUint24();
		this.IV_size = stream.readUint8();
		this.KID = BoxParser.parseHex16(stream);
	}
	var sample_count = stream.readUint32();
	this.samples = [];
	for (var i = 0; i < sample_count; i++) {
		var sample = {};
		sample.InitializationVector = this.readUint8Array(this.IV_size*8);
		if (this.flags & 0x2) {
			sample.subsamples = [];
			sample.NumberOfEntries = stream.readUint16();
			for (var j = 0; j < sample.NumberOfEntries; j++) {
				var subsample = {};
				subsample.BytesOfClearData = stream.readUint16();
				subsample.BytesOfProtectedData = stream.readUint32();
				sample.subsamples.push(subsample);
			}
		}
		this.samples.push(sample);
	}
}*/);

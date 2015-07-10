BoxParser.SampleGroupEntry.prototype.parse = function(stream, length) {
	Log.warn("BoxParser", "Unknown Sample Group type: "+this.grouping_type);
	this.data =  stream.readUint8Array(length);
}


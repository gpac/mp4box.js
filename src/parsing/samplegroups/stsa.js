BoxParser.stsaSampleGroupEntry.prototype.parse = function(stream, length) {
	Log.warn("BoxParser", "Sample Group type: "+this.grouping_type+" not fully parsed");
	this.data =  stream.readUint8Array(length);
}


BoxParser.cslgBox.prototype.write = function(stream) {
	var i;
	this.version = 0;
	this.flags = 0;
	this.size = 4*5;
	this.writeHeader(stream);
	stream.writeInt32(this.compositionToDTSShift);
	stream.writeInt32(this.leastDecodeToDisplayDelta);
	stream.writeInt32(this.greatestDecodeToDisplayDelta);
	stream.writeInt32(this.compositionStartTime);
	stream.writeInt32(this.compositionEndTime);
}


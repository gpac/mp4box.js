BoxParser.TrackReferenceTypeBox = function(type, size, hdr_size, start) {
	BoxParser.Box.call(this, type, size);
	this.hdr_size = hdr_size;
	this.start = start;
}
BoxParser.TrackReferenceTypeBox.prototype = new BoxParser.Box();
BoxParser.TrackReferenceTypeBox.prototype.parse = function(stream) {
	this.track_ids = stream.readUint32Array((this.size-this.hdr_size)/4);
}


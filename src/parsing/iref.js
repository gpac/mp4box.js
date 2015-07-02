BoxParser.irefBox = function(size) {
	BoxParser.FullBox.call(this, "iref", size);
	this.references = [];
}	
BoxParser.irefBox.prototype = new BoxParser.FullBox();
BoxParser.irefBox.prototype.parse = function(stream) {
	var ret;
	var entryCount;
	var box;
	this.parseFullHeader(stream);

	while (stream.position < this.start+this.size) {
		ret = BoxParser.parseOneBox(stream, true);
		if (this.version === 0) {
			box = new BoxParser.SingleItemTypeReferenceBox(ret.type, ret.size, ret.hdr_size, ret.start, ret.fileStart);
		} else {
			box = new BoxParser.SingleItemTypeReferenceBoxLarge(ret.type, ret.size, ret.hdr_size, ret.start, ret.fileStart);
		}
		box.parse(stream);
		this.references.push(box);
	}
}

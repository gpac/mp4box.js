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

	while (stream.getPosition() < this.start+this.size) {
		ret = BoxParser.parseOneBox(stream, true);
		if (this.version === 0) {
			box = new BoxParser.SingleItemTypeReferenceBox(ret.type, ret.size, ret.hdr_size, ret.start);
		} else {
			box = new BoxParser.SingleItemTypeReferenceBoxLarge(ret.type, ret.size, ret.hdr_size, ret.start);
		}
		if (box.write === BoxParser.Box.prototype.write && box.type !== "mdat") {
			Log.warn("BoxParser", box.type+" box writing not yet implemented, keeping unparsed data in memory for later write");
			box.parseDataAndRewind(stream);
		}
		box.parse(stream);
		this.references.push(box);
	}
}

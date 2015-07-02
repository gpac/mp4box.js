BoxParser.SingleItemTypeReferenceBox = function(type, size, hdr_size, start, fileStart) {
	BoxParser.Box.call(this, type, size);
	this.hdr_size = hdr_size;
	this.start = start;
	this.fileStart = fileStart;
}
BoxParser.SingleItemTypeReferenceBox.prototype = new BoxParser.Box();
BoxParser.SingleItemTypeReferenceBox.prototype.parse = function(stream) {
	this.from_item_ID = stream.readUint16();
	var count =  stream.readUint16();
	this.references = [];
	for(var i = 0; i < count; i++) {
		this.references[i] = stream.readUint16();
	}
}


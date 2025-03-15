BoxParser.createBoxCtor("styp", "SegmentTypeBox", function(stream) {
	BoxParser.ftypBox.prototype.parse.call(this, stream);
});


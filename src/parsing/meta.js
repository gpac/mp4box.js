// meta is a FullBox in MPEG-4 and a ContainerBox in QTFF
BoxParser.createContainerBoxCtor("meta", function(stream) {
	this.boxes = [];

	// The QTFF "meta" box does not have a flags/version header
	if (!(stream.behavior & BoxParser.BEHAVIOR_QTFF))
		BoxParser.FullBox.prototype.parseFullHeader.call(this, stream);
	BoxParser.ContainerBox.prototype.parse.call(this, stream);
});

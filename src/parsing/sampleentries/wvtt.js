BoxParser.createSampleEntryCtor(BoxParser.SAMPLE_ENTRY_TYPE_METADATA, "wvtt", function(stream) {
	this.parseHeader(stream);
	this.parseFooter(stream);
});


BoxParser.createBoxCtor("clli", "ContentLightLevelBox", function(stream) {
	this.max_content_light_level = stream.readUint16();
    this.max_pic_average_light_level = stream.readUint16();
});


BoxParser.createBoxCtor("mdcv", function(stream) {
    this.display_primaries = [];
    this.display_primaries[0] = {};
    this.display_primaries[0].x = stream.readUint16();
    this.display_primaries[0].y = stream.readUint16();
    this.display_primaries[1] = {};
    this.display_primaries[1].x = stream.readUint16();
    this.display_primaries[1].y = stream.readUint16();
    this.display_primaries[2] = {};
    this.display_primaries[2].x = stream.readUint16();
    this.display_primaries[2].y = stream.readUint16();
    this.white_point = {};
    this.white_point.x = stream.readUint16();
    this.white_point.y = stream.readUint16();
    this.max_display_mastering_luminance = stream.readUint32();
    this.min_display_mastering_luminance = stream.readUint32();
});


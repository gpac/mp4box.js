function ColorPoint(x, y) {
    this.x = x;
    this.y = y;
}

ColorPoint.prototype.toString = function() {
    return "("+this.x+","+this.y+")";
}

BoxParser.createBoxCtor("mdcv", function(stream) {
    this.display_primaries = [];
    this.display_primaries[0] = new ColorPoint(stream.readUint16(),stream.readUint16());
    this.display_primaries[1] = new ColorPoint(stream.readUint16(),stream.readUint16());
    this.display_primaries[2] = new ColorPoint(stream.readUint16(),stream.readUint16());
    this.white_point = new ColorPoint(stream.readUint16(),stream.readUint16());
    this.max_display_mastering_luminance = stream.readUint32();
    this.min_display_mastering_luminance = stream.readUint32();
});


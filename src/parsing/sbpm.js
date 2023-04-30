function Pixel(row, col) {
	this.bad_pixel_row = row;
	this.bad_pixel_column = col;
}

Pixel.prototype.toString = function pixelToString() {
	return "[row: " + this.bad_pixel_row + ", column: " + this.bad_pixel_column + "]";
}

BoxParser.createFullBoxCtor("sbpm", function(stream) {
	var i;
	this.component_count = stream.readUint16();
    this.component_index = [];
    for (i = 0; i < this.component_count; i++) {
        this.component_index.push(stream.readUint16());
    }
	var flags = stream.readUint8();
	this.correction_applied = (0x80 == (flags & 0x80));
	this.num_bad_rows = stream.readUint32();
	this.num_bad_cols = stream.readUint32();
	this.num_bad_pixels = stream.readUint32();
	this.bad_rows = [];
	this.bad_columns = [];
	this.bad_pixels = [];
	for (i = 0; i < this.num_bad_rows; i++) {
		this.bad_rows.push(stream.readUint32());
	}
	for (i = 0; i < this.num_bad_cols; i++) {
		this.bad_columns.push(stream.readUint32());
	}
	for (i = 0; i < this.num_bad_pixels; i++) {
		var row = stream.readUint32();
		var col = stream.readUint32();
		this.bad_pixels.push(new Pixel(row, col));
	}
});


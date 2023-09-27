BoxParser.createFullBoxCtor("uncC", function(stream) {
    var i;
    this.profile = stream.readUint32();
    if (this.version == 1) {
        // Nothing - just the profile
    } else if (this.version == 0) {
        this.component_count = stream.readUint32();
        this.component_index = [];
        this.component_bit_depth_minus_one = [];
        this.component_format = [];
        this.component_align_size = [];
        for (i = 0; i < this.component_count; i++) {
            this.component_index.push(stream.readUint16());
            this.component_bit_depth_minus_one.push(stream.readUint8());
            this.component_format.push(stream.readUint8());
            this.component_align_size.push(stream.readUint8());
        }
        this.sampling_type = stream.readUint8();
        this.interleave_type = stream.readUint8();
        this.block_size = stream.readUint8();
        var flags = stream.readUint8();
        this.component_little_endian = (flags >> 7) & 0x1;
        this.block_pad_lsb = (flags >> 6) & 0x1;
        this.block_little_endian = (flags >> 5) & 0x1;
        this.block_reversed = (flags >> 4) & 0x1;
        this.pad_unknown = (flags >> 3) & 0x1;
        this.pixel_size = stream.readUint32();
        this.row_align_size = stream.readUint32();
        this.tile_align_size = stream.readUint32();
        this.num_tile_cols_minus_one = stream.readUint32();
        this.num_tile_rows_minus_one = stream.readUint32();
    }
});


BoxParser.hvcCBox.prototype.write = function(stream) {
    var i,j;
    this.size = 23;

    for (i = 0; i < this.nalu_arrays.length; i++) {
      this.size += 3;
      for (j = 0; j < this.nalu_arrays[i].length; j++) {
        this.size += 2 + this.nalu_arrays[i][j].data.length;
      }
    }

    this.writeHeader(stream);

    stream.writeUint8(this.configurationVersion);
    stream.writeUint8((this.general_profile_space << 6) +
                      (this.general_tier_flag << 5) +
                      this.general_profile_idc);
    stream.writeUint32(this.general_profile_compatibility);
    stream.writeUint8Array(this.general_constraint_indicator);
    stream.writeUint8(this.general_level_idc);
    stream.writeUint16(this.min_spatial_segmentation_idc + (15<<24));
    stream.writeUint8(this.parallelismType + (63<<2));
    stream.writeUint8(this.chroma_format_idc + (63<<2));
    stream.writeUint8(this.bit_depth_luma_minus8 + (31<<3));
    stream.writeUint8(this.bit_depth_chroma_minus8 + (31<<3));
    stream.writeUint16(this.avgFrameRate);
    stream.writeUint8((this.constantFrameRate<<6) +
                   (this.numTemporalLayers<<3) +
                   (this.temporalIdNested<<2) +
                   this.lengthSizeMinusOne);
    stream.writeUint8(this.nalu_arrays.length);
    for (i = 0; i < this.nalu_arrays.length; i++) {
      // bit(1) array_completeness + bit(1) reserved = 0 + bit(6) nal_unit_type
      stream.writeUint8((this.nalu_arrays[i].completeness<<7) +
                         this.nalu_arrays[i].nalu_type);
      stream.writeUint16(this.nalu_arrays[i].length);
      for (j = 0; j < this.nalu_arrays[i].length; j++) {
        stream.writeUint16(this.nalu_arrays[i][j].data.length);
        stream.writeUint8Array(this.nalu_arrays[i][j].data);
      }
    }
}

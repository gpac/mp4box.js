BoxParser.createFullBoxCtor("vvcC", function (stream) {
  var i, j;

  // helper object to simplify extracting individual bits
  var bitReader = {
    held_bits: undefined,
    num_held_bits: 0,

    stream_read_1_bytes: function (strm) {
      this.held_bits = strm.readUint8();
      this.num_held_bits = 1 * 8;
    },
    stream_read_2_bytes: function (strm) {
      this.held_bits = strm.readUint16();
      this.num_held_bits = 2 * 8;
    },

    extract_bits: function (num_bits) {
      var ret = (this.held_bits >> (this.num_held_bits - num_bits)) & ((1 << num_bits) - 1);
      this.num_held_bits -= num_bits;
      return ret;
    }
  };

  bitReader.stream_read_1_bytes(stream);
  var reserved = bitReader.extract_bits(5);
  // console.assert(reserved == 0x1f, "expect reserved bits to be all ones");
  this.nal_unit_size = 1 + bitReader.extract_bits(2);
  this.ptl_present = bitReader.extract_bits(1);
  // console.assert(num_bits_remain === 0, "expect all bits to be consumed (" + num_bits_remain + ")");

  if (this.ptl_present) {
    bitReader.stream_read_2_bytes(stream);
    this.ols_idx = bitReader.extract_bits(9);
    this.numTemporalLayers = bitReader.extract_bits(3);
    this.constantFrameRate = bitReader.extract_bits(2);
    this.chroma_format = bitReader.extract_bits(2);
    // console.assert(num_bits_remain === 0, "expect all bits to be consumed (" + num_bits_remain + ")");

    bitReader.stream_read_1_bytes(stream);
    this.bit_depth = 8 + bitReader.extract_bits(3);
    bitReader.extract_bits(5);
    // console.assert(num_bits_remain === 0, "expect all bits to be consumed (" + num_bits_remain + ")");

    //parse PTL
    {
      bitReader.stream_read_2_bytes(stream);
      bitReader.extract_bits(2);
      this.num_constraint_info = bitReader.extract_bits(6);
      this.general_profile_idc = bitReader.extract_bits(7);
      this.general_tier_flag = bitReader.extract_bits(1);
      // console.assert(num_bits_remain === 0, "expect all bits to be consumed (" + num_bits_remain + ")");

      this.general_level_idc = stream.readUint8();

      bitReader.stream_read_1_bytes(stream);
      this.ptl_frame_only_constraint = bitReader.extract_bits(1);
      this.ptl_multilayer_enabled = bitReader.extract_bits(1);
      // console.assert(num_bits_remain === 6, "expect 6 bits to remaining (" + num_bits_remain + ")");

      this.general_constraint_info = new Uint8Array(this.num_constraint_info);
      if (this.num_constraint_info) {
        for (i = 0; i < this.num_constraint_info - 1; i++) {
          var cnstr1 = bitReader.extract_bits(6);
          bitReader.stream_read_1_bytes(stream);
          var cnstr2 = bitReader.extract_bits(2);

          this.general_constraint_info[i] = ((cnstr1 << 2) | cnstr2);
        }
        this.general_constraint_info[this.num_constraint_info - 1] = bitReader.extract_bits(6);
      } else {
        //forbidden in spec!
        bitReader.extract_bits(6);
      }
      // console.assert(num_bits_remain === 0, "expect all bits to be consumed (" + num_bits_remain + ")");

      bitReader.stream_read_1_bytes(stream);
      this.ptl_sublayer_present_mask = 0;
      for (j = this.numTemporalLayers - 2; j >= 0; --j) {
        var val = bitReader.extract_bits(1);
        this.ptl_sublayer_present_mask |= val << j;
      }
      for (j = this.numTemporalLayers; j <= 8 && this.numTemporalLayers > 1; ++j) {
        bitReader.extract_bits(1);
      }
      // console.assert(num_bits_remain === 0, "expect all bits to be consumed (" + num_bits_remain + ")");

      for (j = this.numTemporalLayers - 2; j >= 0; --j) {
        if (this.ptl_sublayer_present_mask & (1 << j)) {
          this.sublayer_level_idc[j] = stream.readUint8();
        }
      }

      this.num_sub_profiles = stream.readUint8();
      if (this.num_sub_profiles) {
        this.sub_profiles_idc = [];
        for (i = 0; i < this.num_sub_profiles; i++) {
          this.sub_profiles_idc.push(stream.readUint32());
        }
      }
    }
    //end PTL

    this.maxPictureWidth = stream.readUint16();
    this.maxPictureHeight = stream.readUint16();
    this.avgFrameRate = stream.readUint16();
  }

  var VVC_NALU_OPI = 12;
  var VVC_NALU_DEC_PARAM = 13;

  this.param_arrays = [];
  var numOfArrays = stream.readUint8();
  for (i = 0; i < numOfArrays; i++) {
    var nalu_array = [];
    this.param_arrays.push(nalu_array);

    bitReader.stream_read_1_bytes(stream);
    nalu_array.completeness = bitReader.extract_bits(1);
    bitReader.extract_bits(2);
    nalu_array.nalu_type = bitReader.extract_bits(5);

    var numNalus;
    if (nalu_array.nalu_type != VVC_NALU_DEC_PARAM && nalu_array.nalu_type != VVC_NALU_OPI) {
      numNalus = stream.readUint16();
    }
    else {
      numNalus = 1;
    }

    for (j = 0; j < numNalus; j++) {
      var len = stream.readUint16();
      nalu_array.push({
        data: stream.readUint8Array(len),
        length: len
      });
    }
  }
});

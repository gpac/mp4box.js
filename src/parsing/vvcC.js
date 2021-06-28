BoxParser.createBoxCtor("vvcC", function (stream) {
  var GF_VVC_NALU_OPI = 12;
  var GF_VVC_NALU_DEC_PARAM = 13;
  var i, j;

  var rem_bits = 0;
  var stream_read_1_bytes = function (strm) {
    var ret = strm.readUint8();
    rem_bits = 1 * 8;
    return ret;
  }
  var stream_read_2_bytes = function (strm) {
    var ret = strm.readUint16();
    rem_bits = 2 * 8;
    return ret;
  }

  var extract_bits = function (val, num_bits) {
    ret = val >> (rem_bits - num_bits) & ((1 << num_bits) - 1);
    rem_bits = rem_bits - num_bits;
    return ret;
  };

  tmp = stream_read_1_bytes(stream);
  rem_bits -= 5;                              // gf_bs_read_int(bs, 5);
  this.nal_unit_size = 1 + extract_bits(tmp, 2); // 1 + gf_bs_read_int(bs, 2);
  this.ptl_present = extract_bits(tmp, 1);       // gf_bs_read_int(bs, 1);
  console.assert(rem_bits === 0, "expect all bits to be consumed (" + rem_bits + ")");

  if (this.ptl_present) {
    tmp = stream_read_2_bytes(stream);
    this.ols_idx = extract_bits(tmp, 9);           // gf_bs_read_int(bs, 9);
    this.numTemporalLayers = extract_bits(tmp, 3); // gf_bs_read_int(bs, 3);
    this.constantFrameRate = extract_bits(tmp, 2); // gf_bs_read_int(bs, 2);
    this.chroma_format = extract_bits(tmp, 2)      // gf_bs_read_int(bs, 2);
    console.assert(rem_bits === 0, "expect all bits to be consumed (" + rem_bits + ")");

    tmp = stream_read_1_bytes(stream);
    this.bit_depth = 8 + extract_bits(tmp, 3); // 8 + gf_bs_read_int(bs, 3);
    rem_bits -= 5;                          // gf_bs_read_int(bs, 5);
    console.assert(rem_bits === 0, "expect all bits to be consumed (" + rem_bits + ")");

    //parse PTL
    tmp = stream_read_2_bytes(stream);
    rem_bits -= 2;                                // gf_bs_read_int(bs, 2);
    this.num_constraint_info = extract_bits(tmp, 6); // gf_bs_read_int(bs, 6);
    this.general_profile_idc = extract_bits(tmp, 7); // gf_bs_read_int(bs, 7);
    this.general_tier_flag = extract_bits(tmp, 1);   // gf_bs_read_int(bs, 1);
    console.assert(rem_bits === 0, "expect all bits to be consumed (" + rem_bits + ")");

    this.general_level_idc = stream.readUint8(); // gf_bs_read_u8(bs);

    tmp = stream_read_1_bytes(stream);
    this.ptl_frame_only_constraint = extract_bits(tmp, 1); // gf_bs_read_int(bs, 1);
    this.ptl_multilayer_enabled = extract_bits(tmp, 1);    //  gf_bs_read_int(bs, 1);
    console.assert(rem_bits === 6, "expect 6 bits to remaining (" + rem_bits + ")");

    this.general_constraint_info = new Uint8Array(this.num_constraint_info);
    if (this.num_constraint_info) {
      for (i = 0; i < this.num_constraint_info - 1; i++) {
        var cnstr1 = extract_bits(tmp, 6);
        tmp = stream_read_1_bytes(stream);
        var cnstr2 = extract_bits(tmp, 2);

        this.general_constraint_info[i] = ((cnstr1 << 2) | cnstr2);
      }
      this.general_constraint_info[this.num_constraint_info - 1] = extract_bits(tmp, 6);
    } else {
      //forbidden in spec!
      rem_bits -= 6; // gf_bs_read_int(bs, 6);
    }
    console.assert(rem_bits === 0, "expect all bits to be consumed (" + rem_bits + ")");

    tmp = stream_read_1_bytes(stream);
    this.ptl_sublayer_present_mask = 0;
    for (j = this.numTemporalLayers - 2; j >= 0; --j) {
      var val = extract_bits(tmp, 1); // gf_bs_read_int(bs, 1);
      this.ptl_sublayer_present_mask |= val << j;
    }
    for (j = this.numTemporalLayers; j <= 8 && this.numTemporalLayers > 1; ++j) {
      rem_bits -= 1; // gf_bs_read_int(bs, 1);
    }
    console.assert(rem_bits === 0, "expect all bits to be consumed (" + rem_bits + ")");

    for (j = this.numTemporalLayers - 2; j >= 0; --j) {
      if (this.ptl_sublayer_present_mask & (1 << j)) {
        this.sublayer_level_idc[j] = stream.readUint8(); // gf_bs_read_u8(bs);
      }
    }

    this.num_sub_profiles = stream.readUint8(); // gf_bs_read_u8(bs);
    if (this.num_sub_profiles) {
      this.sub_profiles_idc = []; // gf_malloc(sizeof(u32) * this.num_sub_profiles);
      for (i = 0; i < this.num_sub_profiles; i++) {
        this.sub_profiles_idc.push(stream.readUint32()); //  gf_bs_read_u32(bs);
      }
    }

    //end PTL

    this.maxPictureWidth = stream.readUint16(); // gf_bs_read_u16(bs);
    this.maxPictureHeight = stream.readUint16(); // gf_bs_read_u16(bs);
    this.avgFrameRate = stream.readUint16(); // gf_bs_read_u16(bs);
  }

  this.nalu_arrays = [];
  var numOfArrays = stream.readUint8(); // gf_bs_read_int(bs, 8);
  for (i = 0; i < numOfArrays; i++) {
    var nalu_array = [];
    this.nalu_arrays.push(nalu_array);
    tmp = stream.readUint8(); rem_bits = 8;
    nalu_array.completeness = extract_bits(tmp, 1);
    rem_bits -= 2;
    nalu_array.nalu_type = extract_bits(tmp, 5);

    var numNalus;
    if (nalu_array.nalu_type != GF_VVC_NALU_DEC_PARAM && nalu_array.nalu_type != GF_VVC_NALU_OPI) {
      numNalus = stream.readUint16();
    }
    else {
      numNalus = 1;
    }

    for (j = 0; j < numNalus; j++) {
      var nalu = {}
      nalu_array.push(nalu);
      var length = stream.readUint16();
      nalu.data = stream.readUint8Array(length);
    }
  }
});

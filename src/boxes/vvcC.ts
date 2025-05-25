import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import type { NaluArray } from '@types';

export class vvcCBox extends FullBox {
  type = 'vvcC' as const;
  box_name = 'VvcConfigurationBox';

  lengthSizeMinusOne: number;
  ptl_present_flag: number;
  ols_idx: number;
  num_sublayers: number;
  constant_frame_rate: number;
  chroma_format_idc: number;
  bit_depth_minus8: number;
  num_bytes_constraint_info: number;
  general_profile_idc: number;
  general_tier_flag: number;
  general_level_idc: number;
  ptl_frame_only_constraint_flag: number;
  ptl_multilayer_enabled_flag: number;
  general_constraint_info: Uint8Array;
  ptl_sublayer_present_mask: number;
  sublayer_level_idc: Array<number>;
  ptl_num_sub_profiles: number;
  general_sub_profile_idc: Array<number>;
  max_picture_width: number;
  max_picture_height: number;
  avg_frame_rate: number;
  nalu_arrays: Array<NaluArray>;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    // helper object to simplify extracting individual bits
    const bitReader = {
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
        const ret = (this.held_bits >> (this.num_held_bits - num_bits)) & ((1 << num_bits) - 1);
        this.num_held_bits -= num_bits;
        return ret;
      },
    };

    // VvcDecoderConfigurationRecord
    bitReader.stream_read_1_bytes(stream);
    bitReader.extract_bits(5); // reserved
    this.lengthSizeMinusOne = bitReader.extract_bits(2);
    this.ptl_present_flag = bitReader.extract_bits(1);

    if (this.ptl_present_flag) {
      bitReader.stream_read_2_bytes(stream);
      this.ols_idx = bitReader.extract_bits(9);
      this.num_sublayers = bitReader.extract_bits(3);
      this.constant_frame_rate = bitReader.extract_bits(2);
      this.chroma_format_idc = bitReader.extract_bits(2);

      bitReader.stream_read_1_bytes(stream);
      this.bit_depth_minus8 = bitReader.extract_bits(3);
      bitReader.extract_bits(5); // reserved

      // VvcPTLRecord
      {
        bitReader.stream_read_2_bytes(stream);
        bitReader.extract_bits(2); // reserved
        this.num_bytes_constraint_info = bitReader.extract_bits(6);
        this.general_profile_idc = bitReader.extract_bits(7);
        this.general_tier_flag = bitReader.extract_bits(1);

        this.general_level_idc = stream.readUint8();

        bitReader.stream_read_1_bytes(stream);
        this.ptl_frame_only_constraint_flag = bitReader.extract_bits(1);
        this.ptl_multilayer_enabled_flag = bitReader.extract_bits(1);

        this.general_constraint_info = new Uint8Array(this.num_bytes_constraint_info);
        if (this.num_bytes_constraint_info) {
          for (let i = 0; i < this.num_bytes_constraint_info - 1; i++) {
            const cnstr1 = bitReader.extract_bits(6);
            bitReader.stream_read_1_bytes(stream);
            const cnstr2 = bitReader.extract_bits(2);

            this.general_constraint_info[i] = (cnstr1 << 2) | cnstr2;
          }
          this.general_constraint_info[this.num_bytes_constraint_info - 1] =
            bitReader.extract_bits(6);
        } else {
          //forbidden in spec!
          bitReader.extract_bits(6);
        }

        if (this.num_sublayers > 1) {
          bitReader.stream_read_1_bytes(stream);
          this.ptl_sublayer_present_mask = 0;
          for (let j = this.num_sublayers - 2; j >= 0; --j) {
            const val = bitReader.extract_bits(1);
            this.ptl_sublayer_present_mask |= val << j;
          }
          for (let j = this.num_sublayers; j <= 8 && this.num_sublayers > 1; ++j) {
            bitReader.extract_bits(1); // ptl_reserved_zero_bit
          }

          this.sublayer_level_idc = [];
          for (let j = this.num_sublayers - 2; j >= 0; --j) {
            if (this.ptl_sublayer_present_mask & (1 << j)) {
              this.sublayer_level_idc[j] = stream.readUint8();
            }
          }
        }

        this.ptl_num_sub_profiles = stream.readUint8();
        this.general_sub_profile_idc = [];
        if (this.ptl_num_sub_profiles) {
          for (let i = 0; i < this.ptl_num_sub_profiles; i++) {
            this.general_sub_profile_idc.push(stream.readUint32());
          }
        }
      } // end VvcPTLRecord

      this.max_picture_width = stream.readUint16();
      this.max_picture_height = stream.readUint16();
      this.avg_frame_rate = stream.readUint16();
    }

    const VVC_NALU_OPI = 12;
    const VVC_NALU_DEC_PARAM = 13;

    this.nalu_arrays = [];
    const num_of_arrays = stream.readUint8();
    for (let i = 0; i < num_of_arrays; i++) {
      const nalu_array = [] as NaluArray;
      this.nalu_arrays.push(nalu_array);

      bitReader.stream_read_1_bytes(stream);
      nalu_array.completeness = bitReader.extract_bits(1);
      bitReader.extract_bits(2); // reserved
      nalu_array.nalu_type = bitReader.extract_bits(5);

      let numNalus = 1;
      if (nalu_array.nalu_type != VVC_NALU_DEC_PARAM && nalu_array.nalu_type != VVC_NALU_OPI) {
        numNalus = stream.readUint16();
      }

      for (let j = 0; j < numNalus; j++) {
        const len = stream.readUint16();
        nalu_array.push({
          data: stream.readUint8Array(len),
          length: len,
        });
      }
    }
  }
}

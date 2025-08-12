/*
 * Copyright (c) 2025. Paul Higgs
 * License: BSD-3-Clause (see LICENSE file)
 */

import { Box } from '#/box';
import { MP4BoxStream } from '#/stream';
import { BitBuffer } from '#/BitBuffer';

import {
  DescribedValue,
  AVS3data,
  HexadecimalValue,
  BinaryValue,
  BooleanValue,
} from './avs-common';

interface ReferencePicture {
  library_index_flag?: number;
  referenced_library_picture_index?: number;
  abs_delta_doi?: number;
  sign_delta_doi?: number;
}

class ReferencePictureSet {
  private _list: number;
  private _set: number;
  private _pics: Array<ReferencePicture>;
  private _reference_to_library_enable_flag?: number;
  private _library_enable_flag_set: boolean;

  constructor(list: number, set: number) {
    this._list = list;
    this._set = set;
    this._pics = [];
    this._library_enable_flag_set = false;
  }
  set_reference_to_library_enable_flag(flag: number) {
    this._library_enable_flag_set = true;
    this._reference_to_library_enable_flag = flag;
  }
  get_reference_to_library_enable_flag(): number {
    return this._library_enable_flag_set ? this._reference_to_library_enable_flag : 0;
  }
  push(pic: ReferencePicture) {
    this._pics.push(pic);
  }
  toString() {
    let ret = '{';
    if (this._library_enable_flag_set)
      ret += 'reference_to_library_enable_flag: ' + this._reference_to_library_enable_flag;
    this._pics.forEach(e => {
      ret += (ret.length > 3 ? ', ' : '') + JSON.stringify(e).replace(/"/g, '');
    });
    ret += '}';
    return ret;
  }
}

class ReferencePictureList {
  private _list?: number;
  private _sets?: Array<ReferencePictureSet>;

  constructor(list: number) {
    this._list = list;
    this._sets = [];
  }
  push(set: ReferencePictureSet) {
    this._sets.push(set);
  }
  toString() {
    if (this._sets.length === 0) return '(empty)';
    const l: Array<string> = [];
    this._sets.forEach(set => {
      l.push(set.toString());
    });
    return l.join(', ');
  }
}

class WeightQuantMatrix {
  WeightQuantMatrix4x4: Array<Array<number>>;
  WeightQuantMatrix8x8: Array<Array<number>>;

  constructor(reader: BitBuffer) {
    this.WeightQuantMatrix4x4 = [];
    this.WeightQuantMatrix8x8 = [];

    for (let sizeId = 0; sizeId < 2; sizeId++) {
      const this_size: Array<Array<number>> = [];
      const WQMSize = 1 << (sizeId + 2);
      for (let i = 0; i < WQMSize; i++) {
        const iVal: Array<number> = [];
        for (let j = 0; j < WQMSize; j++) iVal.push(reader.getUE());
        this_size.push(iVal);
      }
      if (sizeId === 0) this.WeightQuantMatrix4x4 = this_size;
      else this.WeightQuantMatrix8x8 = this_size;
    }
  }
  toString() {
    let str = '';
    if (this.WeightQuantMatrix4x4.length)
      str += '4x4: ' + JSON.stringify(this.WeightQuantMatrix4x4);
    if (this.WeightQuantMatrix8x8.length)
      str += (str.length > 2 ? ',\n' : '') + '8x8: ' + JSON.stringify(this.WeightQuantMatrix8x8);
    return str;
  }
}

const MAIN_8 = 0x20,
  MAIN_10 = 0x22,
  HIGH_8 = 0x30,
  HIGH_10 = 0x32;
const RESERVED = 'Reserved',
  FORBIDDEN = 'Forbidden';
const AVS3profiles = [
  // Table B.1 of T/AI 109.2
  { profile: MAIN_8, description: 'Main 8 bit' },
  { profile: MAIN_10, description: 'Main 10 bit' },
  { profile: HIGH_8, description: 'High 8 bit' },
  { profile: HIGH_10, description: 'High 10 bit' },
  { profile: 0x00, description: FORBIDDEN },
];
const AVS3levels = [
  // Table B.1 of T/AI 109.2
  { level: 0x50, description: '8.0.30' },
  { level: 0x52, description: '8.2.30' },
  { level: 0x51, description: '8.4.30' },
  { level: 0x53, description: '8.6.30' },
  { level: 0x54, description: '8.0.60' },
  { level: 0x56, description: '8.2.60' },
  { level: 0x55, description: '8.4.60' },
  { level: 0x57, description: '8.6.60' },
  { level: 0x58, description: '8.0.120' },
  { level: 0x5a, description: '8.2.120' },
  { level: 0x59, description: '8.4.120' },
  { level: 0x5b, description: '8.6.120' },
  { level: 0x60, description: '10.0.30' },
  { level: 0x62, description: '10.2.30' },
  { level: 0x61, description: '10.4.30' },
  { level: 0x63, description: '10.6.30' },
  { level: 0x64, description: '10.0.60' },
  { level: 0x66, description: '10.2.60' },
  { level: 0x65, description: '10.4.60' },
  { level: 0x67, description: '10.6.60' },
  { level: 0x68, description: '10.0.120' },
  { level: 0x6a, description: '10.2.120' },
  { level: 0x69, description: '10.4.120' },
  { level: 0x6b, description: '10.6.120' },
  { level: 0x10, description: '2.0.15' },
  { level: 0x12, description: '2.0.30' },
  { level: 0x14, description: '2.0.60' },
  { level: 0x20, description: '4.0.30' },
  { level: 0x22, description: '4.0.60' },
  { level: 0x40, description: '6.0.30' },
  { level: 0x42, description: '6.2.30' },
  { level: 0x41, description: '6.4.30' },
  { level: 0x43, description: '6.6.30' },
  { level: 0x44, description: '6.0.60' },
  { level: 0x46, description: '6.2.60' },
  { level: 0x45, description: '6.4.60' },
  { level: 0x47, description: '6.6.60' },
  { level: 0x48, description: '6.0.120' },
  { level: 0x4a, description: '6.2.120' },
  { level: 0x49, description: '6.4.120' },
  { level: 0x4b, description: '6.6.120' },
  { level: 0x00, description: FORBIDDEN },
];
const AVS3precisions = [
  // Table 45 of T/AI 109.2
  { precision: 1, description: '8-bit' },
  { precision: 2, description: '10-bit' },
];
const AVS3framerates = [
  '',
  '24/1.001',
  '24',
  '25',
  '30/1.001',
  '30',
  '50',
  '60/1.001',
  '60',
  '100',
  '120',
  '200',
  '240',
  '300',
  '120/1.001',
];
const AVS3ratios = ['', '1.0', '4:3', '16:9', '2.21:1'];

const AVS3Vconfiguration = (version: number) => (version !== 1 ? 'not supported' : '');

function AVS3profile(profile: number) {
  const t = AVS3profiles.find(e => e.profile === profile);
  return t === undefined ? RESERVED : t.description;
}

function AVS3level(level: number) {
  const t = AVS3levels.find(e => e.level === level);
  return t === undefined ? RESERVED : t.description;
}

function AVS3precision(precision: number) {
  const t = AVS3precisions.find(e => e.precision === precision);
  return t === undefined ? RESERVED : t.description;
}

const AVS3chroma = (chroma: number) => (chroma === 1 ? '4:2:0' : RESERVED);

const AVS3aspectratio = (ratio: number) =>
  ratio === 0 ? FORBIDDEN : ratio >= AVS3ratios.length ? RESERVED : AVS3ratios[ratio];

const AVS3framerate = (framerate: number) =>
  framerate === 0
    ? FORBIDDEN
    : framerate >= AVS3framerates.length
      ? RESERVED
      : AVS3framerates[framerate] + ' fps';

interface SequenceHeaderElements {
  video_sequence_start_code?: HexadecimalValue;
  profile_id?: HexadecimalValue;
  level_id?: HexadecimalValue;
  progressive_sequence?: BooleanValue;
  field_coded_sequence?: BooleanValue;
  library_stream_flag?: BooleanValue;
  library_picture_enable_flag?: BooleanValue;
  duplicate_sequence_number_flag?: BooleanValue;
  horizontal_size?: number;
  vertical_size?: number;
  chroma_format?: BinaryValue;
  sample_precision?: BinaryValue;
  encoding_precision?: BinaryValue;
  aspect_ratio?: BinaryValue;
  frame_rate_code?: BinaryValue;
  bit_rate_lower?: number;
  bit_rate_upper?: number;
  low_delay?: number;
  temporal_id_enable_flag?: BooleanValue;
  max_dpb_minus1?: number;
  bbv_buffer_size?: number;
  rpl1_index_exist_flag?: BooleanValue;
  rpl1_same_as_rpl0_flag?: BooleanValue;
  num_ref_pic_list_set0?: number;
  rpl0?: ReferencePictureList;
  num_ref_pic_list_set1?: number;
  rpl1?: ReferencePictureList;
  num_ref_default_active_minus1_0?: number;
  num_ref_default_active_minus1_1?: number;
  log2_lcu_size_minus2?: number;
  log2_min_cu_size_minus2?: number;
  log2_max_part_ratio_minus2?: number;
  max_split_times_minus6?: number;
  log2_min_qt_size_minus2?: number;
  log2_max_bt_size_minus2?: number;
  log2_max_eqt_size_minus3?: number;
  weight_quant_enable_flag?: BooleanValue;
  load_seq_weight_quant_data_flag?: BooleanValue;
  weight_quant_matrix?: WeightQuantMatrix;
  st_enable_flag?: BooleanValue;
  sao_enable_flag?: BooleanValue;
  alf_enable_flag?: BooleanValue;
  affine_enable_flag?: BooleanValue;
  smvd_enable_flag?: BooleanValue;
  ipcm_enable_flag?: BooleanValue;
  amvr_enable_flag?: BooleanValue;
  num_of_hmvp_cand?: number;
  umve_enable_flag?: BooleanValue;
  emvr_enable_flag?: BooleanValue;
  intra_pf_enable_flag?: BooleanValue;
  tscpm_enable_flag?: BooleanValue;
  dt_enable_flag?: BooleanValue;
  log2_max_dt_size_minus4?: number;
  pbt_enable_flag?: BooleanValue;
  pmc_enable_flag?: BooleanValue;
  iip_enable_flag?: BooleanValue;
  sawp_enable_flag?: BooleanValue;
  asr_enable_flag?: BooleanValue;
  awp_enable_flag?: BooleanValue;
  etmvp_mvap_enable_flag?: BooleanValue;
  dmvr_enable_flag?: BooleanValue;
  bio_enable_flag?: BooleanValue;
  bgc_enable_flag?: BooleanValue;
  inter_pf_enable_flag?: BooleanValue;
  inter_pfc_enable_flag?: BooleanValue;
  obmc_enable_flag?: BooleanValue;
  sbt_enable_flag?: BooleanValue;
  ist_enable_flag?: BooleanValue;
  esao_enable_flag?: BooleanValue;
  ccsao_enable_flag?: BooleanValue;
  ealf_enable_flag?: BooleanValue;
  ibc_enable_flag?: BooleanValue;
  isc_enable_flag?: BooleanValue;
  num_of_intra_hmvp_cand?: number;
  fimc_enable_flag?: BooleanValue;
  nn_tools_set_hook?: number;
  num_of_nn_filter_minus1?: number;
  output_reorder_delay?: number;
  cross_patch_loop_filter_enable_flag?: BooleanValue;
  ref_colocated_patch_flag?: BooleanValue;
  stable_patch_flag?: BooleanValue;
  uniform_patch_flag?: BooleanValue;
  patch_width_minus1?: number;
  patch_height_minus1?: number;
}

class AVS3SequenceHeader extends AVS3data {
  data: SequenceHeaderElements;

  constructor(bit_reader: BitBuffer) {
    super();
    this.data = {};
    this.deserialise(bit_reader);
  }
  deserialise(bit_reader: BitBuffer) {
    this.data.video_sequence_start_code = new HexadecimalValue(bit_reader.getUint32());
    this.data.profile_id = new HexadecimalValue(bit_reader.getUint8(), AVS3profile);
    this.data.level_id = new HexadecimalValue(bit_reader.getUint8(), AVS3level);
    this.data.progressive_sequence = new BooleanValue(bit_reader.getBit());
    this.data.field_coded_sequence = new BooleanValue(bit_reader.getBit());
    this.data.library_stream_flag = new BooleanValue(bit_reader.getBit());
    if (!this.data.library_stream_flag.value) {
      this.data.library_picture_enable_flag = new BooleanValue(bit_reader.getBit());
      if (this.data.library_picture_enable_flag.value)
        this.data.duplicate_sequence_number_flag = new BooleanValue(bit_reader.getBit());
    }
    bit_reader.skipBit(); // marker_bit

    this.data.horizontal_size = bit_reader.getBits(14);
    bit_reader.skipBit(); // marker_bit

    this.data.vertical_size = bit_reader.getBits(14);
    this.data.chroma_format = new BinaryValue(bit_reader.getBits(2), 2, AVS3chroma);
    this.data.sample_precision = new BinaryValue(bit_reader.getBits(3), 3, AVS3precision);

    if (this.data.profile_id.value === MAIN_10 || this.data.profile_id.value === HIGH_10)
      this.data.encoding_precision = new BinaryValue(bit_reader.getBits(3), 3, AVS3precision);
    bit_reader.skipBit(); // marker_bit

    this.data.aspect_ratio = new BinaryValue(bit_reader.getBits(4), 4, AVS3aspectratio);
    this.data.frame_rate_code = new BinaryValue(bit_reader.getBits(4), 4, AVS3framerate);
    bit_reader.skipBit(); // marker_bit

    this.data.bit_rate_lower = bit_reader.getBits(18);
    bit_reader.skipBit(); // marker_bit

    this.data.bit_rate_upper = bit_reader.getBits(12);
    this.data.low_delay = bit_reader.getBit();
    this.data.temporal_id_enable_flag = new BooleanValue(bit_reader.getBit());
    bit_reader.skipBit(); // marker_bit

    this.data.bbv_buffer_size = bit_reader.getBits(18);
    bit_reader.skipBit(); // marker_bit

    this.data.max_dpb_minus1 = bit_reader.getBits(4);
    this.data.rpl1_index_exist_flag = new BooleanValue(bit_reader.getBit());
    this.data.rpl1_same_as_rpl0_flag = new BooleanValue(bit_reader.getBit());
    bit_reader.skipBit(); // marker_bit

    const reference_picture_list = function (
      list: number,
      rpls: number,
      library_picture_enable_flag: boolean,
    ) {
      const this_set = new ReferencePictureSet(list, rpls);
      if (library_picture_enable_flag)
        this_set.set_reference_to_library_enable_flag(bit_reader.getBit());
      const num_of_ref_pic = bit_reader.getUE();
      for (let i = 0; i < num_of_ref_pic; i++) {
        const this_pic: ReferencePicture = {};
        let LibraryIndexFlag = 0;
        if (this_set.get_reference_to_library_enable_flag())
          LibraryIndexFlag = this_pic.library_index_flag = bit_reader.getBit();
        if (LibraryIndexFlag !== 0) this_pic.referenced_library_picture_index = bit_reader.getUE();
        else {
          this_pic.abs_delta_doi = bit_reader.getUE();
          if (this_pic.abs_delta_doi > 0) this_pic.sign_delta_doi = bit_reader.getBit();
        }
        this_set.push(this_pic);
      }
      return this_set;
    };

    this.data.num_ref_pic_list_set0 = bit_reader.getUE();
    this.data.rpl0 = new ReferencePictureList(0);
    for (let j = 0; j < this.data.num_ref_pic_list_set0; j++)
      this.data.rpl0.push(
        reference_picture_list(0, j, this.data.library_picture_enable_flag.value),
      );

    if (!this.data.rpl1_same_as_rpl0_flag) {
      this.data.num_ref_pic_list_set1 = bit_reader.getUE();
      this.data.rpl1 = new ReferencePictureList(1);
      for (let j = 0; j < this.data.num_ref_pic_list_set1; j++)
        this.data.rpl1.push(
          reference_picture_list(1, j, this.data.library_picture_enable_flag.value),
        );
    }

    this.data.num_ref_default_active_minus1_0 = bit_reader.getUE();
    this.data.num_ref_default_active_minus1_1 = bit_reader.getUE();
    this.data.log2_lcu_size_minus2 = bit_reader.getBits(3);
    this.data.log2_min_cu_size_minus2 = bit_reader.getBits(2);
    this.data.log2_max_part_ratio_minus2 = bit_reader.getBits(2);
    this.data.max_split_times_minus6 = bit_reader.getBits(3);
    this.data.log2_min_qt_size_minus2 = bit_reader.getBits(3);
    this.data.log2_max_bt_size_minus2 = bit_reader.getBits(3);
    this.data.log2_max_eqt_size_minus3 = bit_reader.getBits(2);
    bit_reader.skipBit(); // marker_bit

    this.data.weight_quant_enable_flag = new BooleanValue(bit_reader.getBit());
    if (this.data.weight_quant_enable_flag.value) {
      this.data.load_seq_weight_quant_data_flag = new BooleanValue(bit_reader.getBit());
      if (this.data.load_seq_weight_quant_data_flag.value)
        this.data.weight_quant_matrix = new WeightQuantMatrix(bit_reader);
    }

    this.data.st_enable_flag = new BooleanValue(bit_reader.getBit());
    this.data.sao_enable_flag = new BooleanValue(bit_reader.getBit());
    this.data.alf_enable_flag = new BooleanValue(bit_reader.getBit());
    this.data.affine_enable_flag = new BooleanValue(bit_reader.getBit());
    this.data.smvd_enable_flag = new BooleanValue(bit_reader.getBit());
    this.data.ipcm_enable_flag = new BooleanValue(bit_reader.getBit());
    this.data.amvr_enable_flag = new BooleanValue(bit_reader.getBit());
    this.data.num_of_hmvp_cand = bit_reader.getBits(4);
    this.data.umve_enable_flag = new BooleanValue(bit_reader.getBit());
    if (this.data.num_of_hmvp_cand !== 0 && this.data.amvr_enable_flag.value)
      this.data.emvr_enable_flag = new BooleanValue(bit_reader.getBit());
    this.data.intra_pf_enable_flag = new BooleanValue(bit_reader.getBit());
    this.data.tscpm_enable_flag = new BooleanValue(bit_reader.getBit());
    bit_reader.skipBit(); // marker_bit

    this.data.dt_enable_flag = new BooleanValue(bit_reader.getBit());
    if (this.data.dt_enable_flag.value) this.data.log2_max_dt_size_minus4 = bit_reader.getBits(2);
    this.data.pbt_enable_flag = new BooleanValue(bit_reader.getBit());

    if (this.data.profile_id.value === MAIN_10 || this.data.profile_id.value === HIGH_10) {
      this.data.pmc_enable_flag = new BooleanValue(bit_reader.getBit());
      this.data.iip_enable_flag = new BooleanValue(bit_reader.getBit());
      this.data.sawp_enable_flag = new BooleanValue(bit_reader.getBit());
      if (this.data.affine_enable_flag.value)
        this.data.asr_enable_flag = new BooleanValue(bit_reader.getBit());
      this.data.awp_enable_flag = new BooleanValue(bit_reader.getBit());
      this.data.etmvp_mvap_enable_flag = new BooleanValue(bit_reader.getBit());
      this.data.dmvr_enable_flag = new BooleanValue(bit_reader.getBit());
      this.data.bio_enable_flag = new BooleanValue(bit_reader.getBit());
      this.data.bgc_enable_flag = new BooleanValue(bit_reader.getBit());
      this.data.inter_pf_enable_flag = new BooleanValue(bit_reader.getBit());
      this.data.inter_pfc_enable_flag = new BooleanValue(bit_reader.getBit());
      this.data.obmc_enable_flag = new BooleanValue(bit_reader.getBit());

      this.data.sbt_enable_flag = new BooleanValue(bit_reader.getBit());
      this.data.ist_enable_flag = new BooleanValue(bit_reader.getBit());

      this.data.esao_enable_flag = new BooleanValue(bit_reader.getBit());
      this.data.ccsao_enable_flag = new BooleanValue(bit_reader.getBit());
      if (this.data.alf_enable_flag.value)
        this.data.ealf_enable_flag = new BooleanValue(bit_reader.getBit());
      this.data.ibc_enable_flag = new BooleanValue(bit_reader.getBit());
      bit_reader.skipBit(); // marker_bit

      this.data.isc_enable_flag = new BooleanValue(bit_reader.getBit());
      if (this.data.ibc_enable_flag.value || this.data.isc_enable_flag.value)
        this.data.num_of_intra_hmvp_cand = bit_reader.getBits(4);
      this.data.fimc_enable_flag = new BooleanValue(bit_reader.getBit());
      this.data.nn_tools_set_hook = bit_reader.getBits(8);
      if (this.data.nn_tools_set_hook & 0x01)
        this.data.num_of_nn_filter_minus1 = bit_reader.getUE();
      bit_reader.skipBit(); // marker_bit
    }
    if (this.data.low_delay === 0) this.data.output_reorder_delay = bit_reader.getBits(5);
    this.data.cross_patch_loop_filter_enable_flag = new BooleanValue(bit_reader.getBit());
    this.data.ref_colocated_patch_flag = new BooleanValue(bit_reader.getBit());
    this.data.stable_patch_flag = new BooleanValue(bit_reader.getBit());
    if (this.data.stable_patch_flag.value) {
      this.data.uniform_patch_flag = new BooleanValue(bit_reader.getBit());
      if (this.data.uniform_patch_flag.value) {
        bit_reader.skipBit(); // marker_bit
        this.data.patch_width_minus1 = bit_reader.getUE();
        this.data.patch_height_minus1 = bit_reader.getUE();
      }
    }
    bit_reader.skipBits(2); // reserved bits
  }
  //PH  toHTML() {
  //PH    return super.toHTML(this.data);
  //PH  }
  toString() {
    return super.toString(this.data);
  }
}

export class av3cBox extends Box {
  static override readonly fourcc = 'av3c' as const;
  box_name = 'AVS3ConfigurationBox' as const;

  configurationVersion: DescribedValue;
  sequence_header_length?: number;
  sequence_header?: AVS3SequenceHeader;
  library_dependency_idc?: BinaryValue;

  parse(stream: MP4BoxStream) {
    const bit_reader = new BitBuffer();
    this.configurationVersion = new DescribedValue(stream.readUint8(), AVS3Vconfiguration);
    if (this.configurationVersion.value === 1) {
      this.sequence_header_length = stream.readUint16();
      for (let i = 0; i < this.sequence_header_length; i++)
        bit_reader.appendUint8(stream.readUint8());

      this.sequence_header = new AVS3SequenceHeader(bit_reader);

      // library_dependency_idc is in the AVS3DecoderConfigurationRecord
      this.library_dependency_idc = new BinaryValue(stream.readUint8(), 2);
    }
  }
}

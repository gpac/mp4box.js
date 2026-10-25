/*
 * Copyright (c) 2026. Paul Higgs
 * License: BSD-3-Clause (see LICENSE file)
 */

import { Box } from '#/box';
import type { DataStream } from '#/DataStream';
import type { MultiBufferStream } from '#/buffer';

interface ReferencePicture {
  library_index_flag?: boolean;
  referenced_library_picture_index?: number;
  abs_delta_doi?: number;
  sign_delta_doi?: number;
}

class ReferencePictureSet {
  private list: number;
  private set: number;
  private pics: Array<ReferencePicture>;
  private reference_to_library_enable_flag?: number;
  private library_enable_flag_set: boolean;

  constructor(list: number, set: number) {
    this.list = list;
    this.set = set;
    this.pics = [];
    this.library_enable_flag_set = false;
  }

  set_reference_to_library_enable_flag(flag: number) {
    this.library_enable_flag_set = true;
    this.reference_to_library_enable_flag = flag;
  }

  get_reference_to_library_enable_flag(): number {
    return this.library_enable_flag_set ? this.reference_to_library_enable_flag : 0;
  }

  push(pic: ReferencePicture) {
    this.pics.push(pic);
  }

  toString() {
    let ret = '{';
    if (this.library_enable_flag_set) {
      ret += 'reference_to_library_enable_flag: ' + this.reference_to_library_enable_flag;
    }
    this.pics.forEach(e => {
      ret += (ret.length > 3 ? ', ' : '') + JSON.stringify(e).replace(/"/g, '');
    });
    ret += '}';
    return ret;
  }
}

class ReferencePictureList {
  private list?: number;
  private sets?: Array<ReferencePictureSet>;

  constructor(list: number) {
    this.list = list;
    this.sets = [];
  }

  push(set: ReferencePictureSet) {
    this.sets.push(set);
  }

  toString() {
    if (this.sets.length === 0) return '(empty)';
    const l: Array<string> = [];
    this.sets.forEach(set => {
      l.push(set.toString());
    });
    return l.join(', ');
  }
}

class WeightQuantMatrix {
  WeightQuantMatrix4x4: Array<Array<number>>;
  WeightQuantMatrix8x8: Array<Array<number>>;

  constructor(stream: MultiBufferStream) {
    this.WeightQuantMatrix4x4 = [];
    this.WeightQuantMatrix8x8 = [];

    for (let sizeId = 0; sizeId < 2; sizeId++) {
      const this_size: Array<Array<number>> = [];
      const WQMSize = 1 << (sizeId + 2);
      for (let i = 0; i < WQMSize; i++) {
        const iVal: Array<number> = [];
        for (let j = 0; j < WQMSize; j++) {
          iVal.push(stream.readUE());
        }
        this_size.push(iVal);
      }
      if (sizeId === 0) this.WeightQuantMatrix4x4 = this_size;
      else this.WeightQuantMatrix8x8 = this_size;
    }
  }

  toString() {
    let str = '';
    if (this.WeightQuantMatrix4x4.length) {
      str += '4x4: ' + JSON.stringify(this.WeightQuantMatrix4x4);
    }
    if (this.WeightQuantMatrix8x8.length) {
      str += (str.length > 2 ? ',\n' : '') + '8x8: ' + JSON.stringify(this.WeightQuantMatrix8x8);
    }
    return str;
  }
}

const enum AVS3profile {
  MAIN_8 = 0x20,
  MAIN_10 = 0x22,
  HIGH_8 = 0x30,
  HIGH_10 = 0x32,
}

const nextStartCode = (stream: DataStream) => {
  stream.skipBits(1);
  while (!stream.isByteAligned()) {
    stream.skipBits(1);
  }
  while (stream.peekBits(24) !== 0b000000000000000000000001) {
    stream.readUint8();
  }
};

interface AVS3SequenceHeaderElements {
  video_sequence_start_code?: number;
  profile_id?: number;
  level_id?: number;
  progressive_sequence?: boolean;
  field_coded_sequence?: boolean;
  library_stream_flag?: boolean;
  library_picture_enable_flag?: boolean;
  duplicate_sequence_number_flag?: boolean;
  horizontal_size?: number;
  vertical_size?: number;
  chroma_format?: number;
  sample_precision?: number;
  encoding_precision?: number;
  aspect_ratio?: number;
  frame_rate_code?: number;
  bit_rate_lower?: number;
  bit_rate_upper?: number;
  low_delay?: number;
  temporal_id_enable_flag?: boolean;
  max_dpb_minus1?: number;
  bbv_buffer_size?: number;
  rpl1_index_exist_flag?: boolean;
  rpl1_same_as_rpl0_flag?: boolean;
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
  weight_quant_enable_flag?: boolean;
  load_seq_weight_quant_data_flag?: boolean;
  weight_quant_matrix?: WeightQuantMatrix;
  st_enable_flag?: boolean;
  sao_enable_flag?: boolean;
  alf_enable_flag?: boolean;
  affine_enable_flag?: boolean;
  smvd_enable_flag?: boolean;
  ipcm_enable_flag?: boolean;
  amvr_enable_flag?: boolean;
  num_of_hmvp_cand?: number;
  umve_enable_flag?: boolean;
  emvr_enable_flag?: boolean;
  intra_pf_enable_flag?: boolean;
  tscpm_enable_flag?: boolean;
  dt_enable_flag?: boolean;
  log2_max_dt_size_minus4?: number;
  pbt_enable_flag?: boolean;
  pmc_enable_flag?: boolean;
  iip_enable_flag?: boolean;
  sawp_enable_flag?: boolean;
  asr_enable_flag?: boolean;
  awp_enable_flag?: boolean;
  etmvp_mvap_enable_flag?: boolean;
  dmvr_enable_flag?: boolean;
  bio_enable_flag?: boolean;
  bgc_enable_flag?: boolean;
  inter_pf_enable_flag?: boolean;
  inter_pfc_enable_flag?: boolean;
  obmc_enable_flag?: boolean;
  sbt_enable_flag?: boolean;
  ist_enable_flag?: boolean;
  esao_enable_flag?: boolean;
  ccsao_enable_flag?: boolean;
  ealf_enable_flag?: boolean;
  ibc_enable_flag?: boolean;
  isc_enable_flag?: boolean;
  num_of_intra_hmvp_cand?: number;
  fimc_enable_flag?: boolean;
  nn_tools_set_hook?: number;
  num_of_nn_filter_minus1?: number;
  output_reorder_delay?: number;
  cross_patch_loop_filter_enable_flag?: boolean;
  ref_colocated_patch_flag?: boolean;
  stable_patch_flag?: boolean;
  uniform_patch_flag?: boolean;
  patch_width_minus1?: number;
  patch_height_minus1?: number;
}

class AVS3SequenceHeader {
  data: AVS3SequenceHeaderElements;

  constructor(stream: MultiBufferStream) {
    this.data = {};
    this.deserialize(stream);
  }

  deserialize(stream: MultiBufferStream) {
    this.data.video_sequence_start_code = stream.readUint32();
    this.data.profile_id = stream.readUint8();
    this.data.level_id = stream.readUint8();
    this.data.progressive_sequence = stream.readFlag();
    this.data.field_coded_sequence = stream.readFlag();
    this.data.library_stream_flag = stream.readFlag();
    if (!this.data.library_stream_flag) {
      this.data.library_picture_enable_flag = stream.readFlag();
      if (this.data.library_picture_enable_flag)
        this.data.duplicate_sequence_number_flag = stream.readFlag();
    }
    stream.skipBits(1); // marker_bit

    this.data.horizontal_size = stream.readBits(14);
    stream.skipBits(1); // marker_bit

    this.data.vertical_size = stream.readBits(14);
    this.data.chroma_format = stream.readBits(2);
    this.data.sample_precision = stream.readBits(3);

    if (
      this.data.profile_id === AVS3profile.MAIN_10 ||
      this.data.profile_id === AVS3profile.HIGH_10
    )
      this.data.encoding_precision = stream.readBits(3);
    stream.skipBits(1); // marker_bit

    this.data.aspect_ratio = stream.readBits(4);
    this.data.frame_rate_code = stream.readBits(4);
    stream.skipBits(1); // marker_bit

    this.data.bit_rate_lower = stream.readBits(18);
    stream.skipBits(1); // marker_bit

    this.data.bit_rate_upper = stream.readBits(12);
    this.data.low_delay = stream.readBits(1);
    this.data.temporal_id_enable_flag = stream.readFlag();
    stream.skipBits(1); // marker_bit

    this.data.bbv_buffer_size = stream.readBits(18);
    stream.skipBits(1); // marker_bit

    this.data.max_dpb_minus1 = stream.readBits(4);
    this.data.rpl1_index_exist_flag = stream.readFlag();
    this.data.rpl1_same_as_rpl0_flag = stream.readFlag();
    stream.skipBits(1); // marker_bit

    const makeReferencePictureList = (
      list: number,
      rpls: number,
      library_picture_enable_flag: boolean,
    ) => {
      const this_set = new ReferencePictureSet(list, rpls);
      if (library_picture_enable_flag)
        this_set.set_reference_to_library_enable_flag(stream.readBits(1));
      const num_of_ref_pic = stream.readUE();
      for (let i = 0; i < num_of_ref_pic; i++) {
        const this_pic: ReferencePicture = {};
        let libraryIndexFlag = false;
        if (this_set.get_reference_to_library_enable_flag())
          libraryIndexFlag = this_pic.library_index_flag = stream.readFlag();
        if (libraryIndexFlag) this_pic.referenced_library_picture_index = stream.readUE();
        else {
          this_pic.abs_delta_doi = stream.readUE();
          if (this_pic.abs_delta_doi > 0) this_pic.sign_delta_doi = stream.readBits(1);
        }
        this_set.push(this_pic);
      }
      return this_set;
    };

    this.data.num_ref_pic_list_set0 = stream.readUE();
    this.data.rpl0 = new ReferencePictureList(0);
    for (let j = 0; j < this.data.num_ref_pic_list_set0; j++)
      this.data.rpl0.push(makeReferencePictureList(0, j, this.data.library_picture_enable_flag));

    if (!this.data.rpl1_same_as_rpl0_flag) {
      this.data.num_ref_pic_list_set1 = stream.readUE();
      this.data.rpl1 = new ReferencePictureList(1);
      for (let j = 0; j < this.data.num_ref_pic_list_set1; j++)
        this.data.rpl1.push(makeReferencePictureList(1, j, this.data.library_picture_enable_flag));
    }

    this.data.num_ref_default_active_minus1_0 = stream.readUE();
    this.data.num_ref_default_active_minus1_1 = stream.readUE();
    this.data.log2_lcu_size_minus2 = stream.readBits(3);
    this.data.log2_min_cu_size_minus2 = stream.readBits(2);
    this.data.log2_max_part_ratio_minus2 = stream.readBits(2);
    this.data.max_split_times_minus6 = stream.readBits(3);
    this.data.log2_min_qt_size_minus2 = stream.readBits(3);
    this.data.log2_max_bt_size_minus2 = stream.readBits(3);
    this.data.log2_max_eqt_size_minus3 = stream.readBits(2);
    stream.skipBits(1); // marker_bit

    this.data.weight_quant_enable_flag = stream.readFlag();
    if (this.data.weight_quant_enable_flag) {
      this.data.load_seq_weight_quant_data_flag = stream.readFlag();
      if (this.data.load_seq_weight_quant_data_flag)
        this.data.weight_quant_matrix = new WeightQuantMatrix(stream);
    }

    this.data.st_enable_flag = stream.readFlag();
    this.data.sao_enable_flag = stream.readFlag();
    this.data.alf_enable_flag = stream.readFlag();
    this.data.affine_enable_flag = stream.readFlag();
    this.data.smvd_enable_flag = stream.readFlag();
    this.data.ipcm_enable_flag = stream.readFlag();
    this.data.amvr_enable_flag = stream.readFlag();
    this.data.num_of_hmvp_cand = stream.readBits(4);
    this.data.umve_enable_flag = stream.readFlag();
    if (this.data.num_of_hmvp_cand !== 0 && this.data.amvr_enable_flag)
      this.data.emvr_enable_flag = stream.readFlag();
    this.data.intra_pf_enable_flag = stream.readFlag();
    this.data.tscpm_enable_flag = stream.readFlag();
    stream.skipBits(1); // marker_bit

    this.data.dt_enable_flag = stream.readFlag();
    if (this.data.dt_enable_flag) this.data.log2_max_dt_size_minus4 = stream.readBits(2);
    this.data.pbt_enable_flag = stream.readFlag();

    if (
      this.data.profile_id === AVS3profile.MAIN_10 ||
      this.data.profile_id === AVS3profile.HIGH_10
    ) {
      this.data.pmc_enable_flag = stream.readFlag();
      this.data.iip_enable_flag = stream.readFlag();
      this.data.sawp_enable_flag = stream.readFlag();
      if (this.data.affine_enable_flag) this.data.asr_enable_flag = stream.readFlag();
      this.data.awp_enable_flag = stream.readFlag();
      this.data.etmvp_mvap_enable_flag = stream.readFlag();
      this.data.dmvr_enable_flag = stream.readFlag();
      this.data.bio_enable_flag = stream.readFlag();
      this.data.bgc_enable_flag = stream.readFlag();
      this.data.inter_pf_enable_flag = stream.readFlag();
      this.data.inter_pfc_enable_flag = stream.readFlag();
      this.data.obmc_enable_flag = stream.readFlag();

      this.data.sbt_enable_flag = stream.readFlag();
      this.data.ist_enable_flag = stream.readFlag();

      this.data.esao_enable_flag = stream.readFlag();
      this.data.ccsao_enable_flag = stream.readFlag();
      if (this.data.alf_enable_flag) this.data.ealf_enable_flag = stream.readFlag();
      this.data.ibc_enable_flag = stream.readFlag();
      stream.skipBits(1); // marker_bit

      this.data.isc_enable_flag = stream.readFlag();
      if (this.data.ibc_enable_flag || this.data.isc_enable_flag)
        this.data.num_of_intra_hmvp_cand = stream.readBits(4);
      this.data.fimc_enable_flag = stream.readFlag();
      this.data.nn_tools_set_hook = stream.readBits(8);
      if (this.data.nn_tools_set_hook & 0x01) this.data.num_of_nn_filter_minus1 = stream.readUE();
      stream.skipBits(1); // marker_bit
    }
    if (this.data.low_delay === 0) this.data.output_reorder_delay = stream.readBits(5);
    this.data.cross_patch_loop_filter_enable_flag = stream.readFlag();
    this.data.ref_colocated_patch_flag = stream.readFlag();
    this.data.stable_patch_flag = stream.readFlag();
    if (this.data.stable_patch_flag) {
      this.data.uniform_patch_flag = stream.readFlag();
      if (this.data.uniform_patch_flag) {
        stream.skipBits(1); // marker_bit
        this.data.patch_width_minus1 = stream.readUE();
        this.data.patch_height_minus1 = stream.readUE();
      }
    }
    stream.skipBits(2); // reserved bits

    nextStartCode(stream);
  }

  toString() {
    let res = '';
    const props = Object.getOwnPropertyNames(this.data);
    props.forEach(property => {
      let fmt_val = '';
      if (Array.isArray(this.data[property])) {
        for (let i = 0; i < this.data[property].length; i++) {
          const hex = this.data[property][i].toString(16);
          fmt_val += hex.length === 1 ? '0' + hex : hex;
          if (i % 4 === 3) fmt_val += ' ';
        }
      } else fmt_val = this.data[property];
      res += `${property}: ${fmt_val}\n`;
    });
    return res;
  }
}

export class av3cBox extends Box {
  static override readonly fourcc = 'av3c' as const;
  box_name = 'AVS3ConfigurationBox' as const;

  configurationVersion: number;
  sequence_header_length?: number;
  sequence_header?: AVS3SequenceHeader;
  library_dependency_idc?: number;

  parse(stream: MultiBufferStream) {
    this.configurationVersion = stream.readUint8();
    if (this.configurationVersion === 1) {
      this.sequence_header_length = stream.readUint16();
      stream.enterBitMode();
      this.sequence_header = new AVS3SequenceHeader(stream);
      stream.exitBitMode(false); // bit padding till byte alignment

      // library_dependency_idc is in the AVS3DecoderConfigurationRecord
      this.library_dependency_idc = stream.readUint8();
    }
  }
}

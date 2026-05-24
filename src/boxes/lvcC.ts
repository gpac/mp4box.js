import { Box } from '#/box';
import { Log } from '#/log';
import type { MultiBufferStream } from '#/buffer';
import type { NaluArray } from '@types';
import type { NALUArrays } from './displays/naluArrays';

export class lvcCBox extends Box {
  static override readonly fourcc = 'lvcC' as const;
  box_name = 'LCEVCConfigurationBox' as const;

  configurationVersion: number;
  LCEVCProfileIndication: number;
  LCEVCLevelIndication: number;
  chroma_format_idc: number;
  bit_depth_luma_minus8: number;
  bit_depth_chroma_minus8: number;
  lengthSizeMinusOne: number;
  pic_width_in_luma_samples: number;
  pic_height_in_luma_samples: number;
  sc_in_stream: number;
  gc_in_stream: number;
  ai_in_stream: number;
  nalu_arrays: NALUArrays;

  parse(stream: MultiBufferStream) {
    this.configurationVersion = stream.readUint8();
    if (this.configurationVersion !== 1) {
      Log.error(
        'BoxParser',
        'lvcC version ' + this.configurationVersion + ' not supported',
        stream.isofile,
      );
      return;
    }
    this.LCEVCProfileIndication = stream.readUint8();
    this.LCEVCLevelIndication = stream.readUint8();
    let tmp_byte = stream.readUint8();
    this.chroma_format_idc = (tmp_byte >> 6) & 0x3;
    this.bit_depth_luma_minus8 = (tmp_byte >> 3) & 0x7;
    this.bit_depth_chroma_minus8 = tmp_byte & 0x7;
    tmp_byte = stream.readUint8();
    this.lengthSizeMinusOne = (tmp_byte >> 6) & 0x3;
    let reserved = tmp_byte & 0x3f;
    if (reserved !== 0x3f) {
      Log.error('BoxParser', 'lvcC reserved parsing problem', stream.isofile);
      return;
    }
    this.pic_width_in_luma_samples = stream.readUint32();
    this.pic_height_in_luma_samples = stream.readUint32();
    tmp_byte = stream.readUint8();
    this.sc_in_stream = (tmp_byte >> 7) & 0x1;
    this.gc_in_stream = (tmp_byte >> 6) & 0x1;
    this.ai_in_stream = (tmp_byte >> 5) & 0x1;
    reserved = tmp_byte & 0x1f;
    if (reserved !== 0x1f) {
      Log.error('BoxParser', 'lvcC reserved parsing problem', stream.isofile);
      return;
    }

    this.nalu_arrays = [];
    const numOfArrays = stream.readUint8();

    for (let i = 0; i < numOfArrays; i++) {
      const nalu_array = [] as NaluArray;
      this.nalu_arrays.push(nalu_array);
      tmp_byte = stream.readUint8();
      reserved = (tmp_byte >> 6) & 0x3;
      if (reserved !== 0) {
        Log.error('BoxParser', 'lvcC reserved parsing problem', stream.isofile);
        return;
      }
      nalu_array.nalu_type = tmp_byte & 0x3f;
      const numOfNalus = stream.readUint16();
      for (let j = 0; j < numOfNalus; j++) {
        const length = stream.readUint16();
        nalu_array.push({ data: stream.readUint8Array(length) });
      }
    }
  }
}

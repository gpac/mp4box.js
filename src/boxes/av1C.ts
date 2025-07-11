import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { Log } from '#/log';

export class av1CBox extends Box {
  static override readonly fourcc = 'av1C' as const;
  box_name = 'AV1CodecConfigurationBox' as const;

  version: number;
  seq_profile: number;
  seq_level_idx_0: number;
  seq_tier_0: number;
  high_bitdepth: number;
  twelve_bit: number;
  monochrome: number;
  chroma_subsampling_x: number;
  chroma_subsampling_y: number;
  chroma_sample_position: number;
  reserved_1: number;
  initial_presentation_delay_present: number;
  initial_presentation_delay_minus_one: number;
  reserved_2: number;
  configOBUs: Uint8Array;

  parse(stream: MultiBufferStream) {
    let tmp = stream.readUint8();
    if (((tmp >> 7) & 0x1) !== 1) {
      Log.error('BoxParser', 'av1C marker problem', stream.isofile);
      return;
    }
    this.version = tmp & 0x7f;
    if (this.version !== 1) {
      Log.error('BoxParser', 'av1C version ' + this.version + ' not supported', stream.isofile);
      return;
    }
    tmp = stream.readUint8();
    this.seq_profile = (tmp >> 5) & 0x7;
    this.seq_level_idx_0 = tmp & 0x1f;
    tmp = stream.readUint8();
    this.seq_tier_0 = (tmp >> 7) & 0x1;
    this.high_bitdepth = (tmp >> 6) & 0x1;
    this.twelve_bit = (tmp >> 5) & 0x1;
    this.monochrome = (tmp >> 4) & 0x1;
    this.chroma_subsampling_x = (tmp >> 3) & 0x1;
    this.chroma_subsampling_y = (tmp >> 2) & 0x1;
    this.chroma_sample_position = tmp & 0x3;
    tmp = stream.readUint8();
    this.reserved_1 = (tmp >> 5) & 0x7;
    if (this.reserved_1 !== 0) {
      Log.error('BoxParser', 'av1C reserved_1 parsing problem', stream.isofile);
      return;
    }
    this.initial_presentation_delay_present = (tmp >> 4) & 0x1;
    if (this.initial_presentation_delay_present === 1) {
      this.initial_presentation_delay_minus_one = tmp & 0xf;
    } else {
      this.reserved_2 = tmp & 0xf;
      if (this.reserved_2 !== 0) {
        Log.error('BoxParser', 'av1C reserved_2 parsing problem', stream.isofile);
        return;
      }
    }

    const configOBUs_length = this.size - this.hdr_size - 4;
    this.configOBUs = stream.readUint8Array(configOBUs_length);
  }
}

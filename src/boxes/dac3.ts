import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class dac3Box extends Box {
  fscod: number;
  bsid: number;
  bsmod: number;
  acmod: number;
  lfeon: number;
  bit_rate_code: number;

  type = 'dac3' as const;

  parse(stream: MultiBufferStream) {
    let tmp_byte1 = stream.readUint8();
    let tmp_byte2 = stream.readUint8();
    let tmp_byte3 = stream.readUint8();
    this.fscod = tmp_byte1 >> 6;
    this.bsid = (tmp_byte1 >> 1) & 0x1f;
    this.bsmod = ((tmp_byte1 & 0x1) << 2) | ((tmp_byte2 >> 6) & 0x3);
    this.acmod = (tmp_byte2 >> 3) & 0x7;
    this.lfeon = (tmp_byte2 >> 2) & 0x1;
    this.bit_rate_code = (tmp_byte2 & 0x3) | ((tmp_byte3 >> 5) & 0x7);
  }
}

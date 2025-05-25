import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

interface IndSub {
  fscod: number;
  bsid: number;
  bsmod: number;
  acmod: number;
  lfeon: number;
  num_dep_sub: number;
  chan_loc?: number;
}

export class dec3Box extends Box {
  type = 'dec3' as const;
  box_name = 'EC3SpecificBox';

  data_rate: number;
  num_ind_sub: number;
  ind_subs: Array<IndSub>;

  parse(stream: MultiBufferStream) {
    let tmp_16 = stream.readUint16();
    this.data_rate = tmp_16 >> 3;
    this.num_ind_sub = tmp_16 & 0x7;
    this.ind_subs = [];
    for (let i = 0; i < this.num_ind_sub + 1; i++) {
      let tmp_byte1 = stream.readUint8();
      let tmp_byte2 = stream.readUint8();
      let tmp_byte3 = stream.readUint8();
      let ind_sub: IndSub = {
        fscod: tmp_byte1 >> 6,
        bsid: (tmp_byte1 >> 1) & 0x1f,
        bsmod: ((tmp_byte1 & 0x1) << 4) | ((tmp_byte2 >> 4) & 0xf),
        acmod: (tmp_byte2 >> 1) & 0x7,
        lfeon: tmp_byte2 & 0x1,
        num_dep_sub: (tmp_byte3 >> 1) & 0xf,
      };
      this.ind_subs.push(ind_sub);
      if (ind_sub.num_dep_sub > 0) {
        ind_sub.chan_loc = ((tmp_byte3 & 0x1) << 8) | stream.readUint8();
      }
    }
  }
}

import { FullBox } from '../box';
import type { MultiBufferStream } from '../buffer';

export class ccstBox extends FullBox {
  all_ref_pics_intra?: boolean;
  intra_pred_used?: boolean;
  max_ref_per_pic?: number;

  constructor(size?: number) {
    super('ccst', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    var flags = stream.readUint8();
    this.all_ref_pics_intra = (flags & 0x80) == 0x80;
    this.intra_pred_used = (flags & 0x40) == 0x40;
    this.max_ref_per_pic = (flags & 0x3f) >> 2;
    stream.readUint24();
  }
}

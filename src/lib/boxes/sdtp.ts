import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class sdtpBox extends FullBox {
  is_leading: Array<number>;
  sample_depends_on: Array<number>;
  sample_is_depended_on: Array<number>;
  sample_has_redundancy: Array<number>;

  constructor(size?: number) {
    super('sdtp', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    const count = this.size - this.hdr_size;
    this.is_leading = [];
    this.sample_depends_on = [];
    this.sample_is_depended_on = [];
    this.sample_has_redundancy = [];
    for (let i = 0; i < count; i++) {
      const tmp_byte = stream.readUint8();
      this.is_leading[i] = tmp_byte >> 6;
      this.sample_depends_on[i] = (tmp_byte >> 4) & 0x3;
      this.sample_is_depended_on[i] = (tmp_byte >> 2) & 0x3;
      this.sample_has_redundancy[i] = tmp_byte & 0x3;
    }
  }
}

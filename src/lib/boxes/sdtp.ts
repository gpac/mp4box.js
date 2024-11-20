import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class sdtpBox extends FullBox {
  is_leading?: number[];
  sample_depends_on?: number[];
  sample_is_depended_on?: number[];
  sample_has_redundancy?: number[];

  constructor(size?: number) {
    super('sdtp', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    var tmp_byte;
    var count = this.size - this.hdr_size;
    this.is_leading = [];
    this.sample_depends_on = [];
    this.sample_is_depended_on = [];
    this.sample_has_redundancy = [];
    for (var i = 0; i < count; i++) {
      tmp_byte = stream.readUint8();
      this.is_leading[i] = tmp_byte >> 6;
      this.sample_depends_on[i] = (tmp_byte >> 4) & 0x3;
      this.sample_is_depended_on[i] = (tmp_byte >> 2) & 0x3;
      this.sample_has_redundancy[i] = tmp_byte & 0x3;
    }
  }
}
import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

class PaddingBit {
  constructor(
    public pad1: number,
    public pad2: number,
  ) {}
}

export class padbBox extends FullBox {
  static fourcc = 'padb' as const;
  box_name = 'PaddingBitsBox' as const;

  padbits: Array<PaddingBit>;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    const sample_count = stream.readUint32();
    this.padbits = [];
    for (let i = 0; i < Math.floor((sample_count + 1) / 2); i++) {
      const bits = stream.readUint8();
      const pad1 = (bits & 0x70) >> 4; // 5,6,7 bits
      const pad2 = bits & 0x07; // 0,1,2 bits
      this.padbits.push(new PaddingBit(pad1, pad2));
    }
  }
}

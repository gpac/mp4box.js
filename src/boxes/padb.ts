import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class padbBox extends FullBox {
  type = 'padb' as const;
  box_name = 'PaddingBitsBox';

  padbits: number | Array<number>;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    const sample_count = stream.readUint32();
    this.padbits = [];
    for (let i = 0; i < Math.floor((sample_count + 1) / 2); i++) {
      // TODO: is this a bug?
      this.padbits = stream.readUint8();
    }
  }
}

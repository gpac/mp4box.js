import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class padbBox extends FullBox {
  padbits: number | Array<number>;

  type = 'padb' as const;
  constructor(size?: number) {
    super(size);
  }

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

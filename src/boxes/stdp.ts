import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class stdpBox extends FullBox {
  priority: Array<number>;

  type = 'stpd' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    let count = (this.size - this.hdr_size) / 2;
    this.priority = [];
    for (let i = 0; i < count; i++) {
      this.priority[i] = stream.readUint16();
    }
  }
}

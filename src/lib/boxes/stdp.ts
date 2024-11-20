import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class stdpBox extends FullBox {
  priority?: number[];

  constructor(size?: number) {
    super('stpd', size);
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

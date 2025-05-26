import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class stdpBox extends FullBox {
  type = 'stpd' as const;
  box_name = 'DegradationPriorityBox';

  priority: number[];

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    const count = (this.size - this.hdr_size) / 2;
    this.priority = [];
    for (let i = 0; i < count; i++) {
      this.priority[i] = stream.readUint16();
    }
  }
}

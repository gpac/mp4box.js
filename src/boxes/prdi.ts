import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class prdiBox extends FullBox {
  step_count: number;
  item_count: Array<number>;

  type = 'prdi' as const;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.step_count = stream.readUint16();
    this.item_count = [];
    if (this.flags & 0x2) {
      for (let i = 0; i < this.step_count; i++) {
        this.item_count[i] = stream.readUint16();
      }
    }
  }
}

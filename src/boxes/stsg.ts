import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class stsgBox extends FullBox {
  grouping_type: number;
  group_description_index: Array<number>;

  type = 'stsg' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.grouping_type = stream.readUint32();
    const count = stream.readUint16();
    this.group_description_index = [];
    for (let i = 0; i < count; i++) {
      this.group_description_index[i] = stream.readUint32();
    }
  }
}

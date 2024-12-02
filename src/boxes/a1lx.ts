import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class a1lxBox extends Box {
  layer_size: Array<number>;

  type = 'a1lx' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    const large_size = stream.readUint8() & 1;
    const FieldLength = ((large_size & 1) + 1) * 16;
    this.layer_size = [];
    for (let i = 0; i < 3; i++) {
      if (FieldLength == 16) {
        this.layer_size[i] = stream.readUint16();
      } else {
        this.layer_size[i] = stream.readUint32();
      }
    }
  }
}

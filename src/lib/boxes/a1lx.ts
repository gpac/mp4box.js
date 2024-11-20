import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class a1lxBox extends Box {
  layer_size: Array<number>;

  constructor(size?: number) {
    super('a1lx', size);
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

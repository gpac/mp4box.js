import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class tycoBox extends Box {
  compatible_brands: Array<string>;

  type = 'tyco' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    const count = (this.size - this.hdr_size) / 4;
    this.compatible_brands = [];
    for (let i = 0; i < count; i++) {
      this.compatible_brands[i] = stream.readString(4);
    }
  }
}

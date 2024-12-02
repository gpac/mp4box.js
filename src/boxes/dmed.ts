import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class dmedBox extends Box {
  bytessent: number;

  type = 'dmed' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

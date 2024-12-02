import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class dimmBox extends Box {
  bytessent: number;

  type = 'dimm' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

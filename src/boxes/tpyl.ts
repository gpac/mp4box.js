import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class tpylBox extends Box {
  bytessent: number;

  type = 'tpyl' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

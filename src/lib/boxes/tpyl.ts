import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class tpylBox extends Box {
  bytessent: number;

  constructor(size?: number) {
    super('tpyl', size);
  }

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

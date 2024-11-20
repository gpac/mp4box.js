import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class drepBox extends Box {
  bytessent: number;

  constructor(size?: number) {
    super('drep', size);
  }

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

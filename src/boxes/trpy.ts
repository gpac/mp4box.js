import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class trpyBox extends Box {
  bytessent: number;

  type = 'trpy' as const;

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

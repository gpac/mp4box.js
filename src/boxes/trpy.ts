import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class trpyBox extends Box {
  type = 'trpy' as const;

  bytessent: number;

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

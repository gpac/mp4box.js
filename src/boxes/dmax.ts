import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class dmax extends Box {
  time: number;

  type = 'dmax' as const;

  parse(stream: MultiBufferStream) {
    this.time = stream.readUint32();
  }
}

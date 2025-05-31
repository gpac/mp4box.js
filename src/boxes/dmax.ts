import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class dmax extends Box {
  static fourcc = 'dmax' as const;
  box_name = 'hintlongestpacket' as const;

  time: number;

  parse(stream: MultiBufferStream) {
    this.time = stream.readUint32();
  }
}

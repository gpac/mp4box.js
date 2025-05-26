import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class dmax extends Box {
  type = 'dmax' as const;
  box_name = 'hintlongestpacket';

  time: number;

  parse(stream: MultiBufferStream) {
    this.time = stream.readUint32();
  }
}

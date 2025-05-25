import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class tmaxBox extends Box {
  type = 'tmax' as const;
  box_name = 'hintmaxrelativetime';

  time: number;

  parse(stream: MultiBufferStream) {
    this.time = stream.readUint32();
  }
}

import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class maxrBox extends Box {
  type = 'maxr' as const;
  box_name = 'hintmaxrate'

  period: number;
  bytes: number;

  parse(stream: MultiBufferStream) {
    this.period = stream.readUint32();
    this.bytes = stream.readUint32();
  }
}

import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class maxrBox extends Box {
  static override fourcc = 'maxr' as const;
  box_name = 'hintmaxrate' as const;

  period: number;
  bytes: number;

  parse(stream: MultiBufferStream) {
    this.period = stream.readUint32();
    this.bytes = stream.readUint32();
  }
}

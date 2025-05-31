import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class tmaxBox extends Box {
  static override fourcc = 'tmax' as const;
  box_name = 'hintmaxrelativetime' as const;

  time: number;

  parse(stream: MultiBufferStream) {
    this.time = stream.readUint32();
  }
}

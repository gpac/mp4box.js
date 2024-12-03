import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class tminBox extends Box {
  type = 'tmin' as const;

  time: number;

  parse(stream: MultiBufferStream) {
    this.time = stream.readUint32();
  }
}

import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class tminBox extends Box {
  time: number;

  type = 'tmin' as const;

  parse(stream: MultiBufferStream) {
    this.time = stream.readUint32();
  }
}

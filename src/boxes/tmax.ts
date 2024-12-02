import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class tmaxBox extends Box {
  time: number;

  type = 'tmax' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.time = stream.readUint32();
  }
}

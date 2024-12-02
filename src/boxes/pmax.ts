import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class pmaxBox extends Box {
  bytes: number;

  type = 'pmax' as const;

  parse(stream: MultiBufferStream) {
    this.bytes = stream.readUint32();
  }
}

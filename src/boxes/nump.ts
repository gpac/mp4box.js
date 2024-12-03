import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class numpBox extends Box {
  type = 'nump' as const;

  packetssent: number;

  parse(stream: MultiBufferStream) {
    this.packetssent = stream.readUint64();
  }
}

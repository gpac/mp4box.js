import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class numpBox extends Box {
  packetssent: number;

  type = 'nump' as const;

  parse(stream: MultiBufferStream) {
    this.packetssent = stream.readUint64();
  }
}

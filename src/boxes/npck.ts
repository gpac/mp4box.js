import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class npckBox extends Box {
  type = 'npck' as const;

  packetssent: number;

  parse(stream: MultiBufferStream) {
    this.packetssent = stream.readUint32();
  }
}

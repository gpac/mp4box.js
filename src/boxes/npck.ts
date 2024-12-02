import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class npckBox extends Box {
  packetssent: number;

  type = 'npck' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.packetssent = stream.readUint32();
  }
}

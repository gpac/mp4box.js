import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class numpBox extends Box {
  packetssent: number;

  constructor(size?: number) {
    super('nump', size);
  }

  parse(stream: MultiBufferStream) {
    this.packetssent = stream.readUint64();
  }
}

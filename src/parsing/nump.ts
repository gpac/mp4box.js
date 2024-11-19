import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class numpBox extends Box {
  packetssent?: number;

  constructor(size?: number) {
    super('nump', size);
  }

  parse(stream: MultiBufferStream) {
    this.packetssent = stream.readUint64();
  }
}

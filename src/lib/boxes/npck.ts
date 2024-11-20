import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class npckBox extends Box {
  packetssent: number;

  constructor(size?: number) {
    super('npck', size);
  }

  parse(stream: MultiBufferStream) {
    this.packetssent = stream.readUint32();
  }
}

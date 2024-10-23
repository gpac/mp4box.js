import { Box } from '../box';
import type { MultiBufferStream } from '../buffer';

export class npckBox extends Box {
  packetssent?: number;

  constructor(size?: number) {
    super('npck', size);
  }

  parse(stream: MultiBufferStream) {
    this.packetssent = stream.readUint32();
  }
}

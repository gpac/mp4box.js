import { Box } from '../box';
import type { MultiBufferStream } from '../buffer';

export class tmaxBox extends Box {
  time?: number;

  constructor(size?: number) {
    super('tmax', size);
  }

  parse(stream: MultiBufferStream) {
    this.time = stream.readUint32();
  }
}

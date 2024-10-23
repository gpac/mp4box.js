import { Box } from '../box';
import type { MultiBufferStream } from '../buffer';

export class tminBox extends Box {
  time?: number;

  constructor(size?: number) {
    super('tmin', size);
  }

  parse(stream: MultiBufferStream) {
    this.time = stream.readUint32();
  }
}

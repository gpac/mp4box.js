import { Box } from '../box';
import type { MultiBufferStream } from '../buffer';

export class trpyBox extends Box {
  bytessent?: number;

  constructor(size?: number) {
    super('trpy', size);
  }

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

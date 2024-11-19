import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class trpyBox extends Box {
  bytessent?: number;

  constructor(size?: number) {
    super('trpy', size);
  }

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class dmedBox extends Box {
  bytessent?: number;

  constructor(size?: number) {
    super('dmed', size);
  }

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

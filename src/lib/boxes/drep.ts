import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class drepBox extends Box {
  bytessent?: number;

  constructor(size?: number) {
    super('drep', size);
  }

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

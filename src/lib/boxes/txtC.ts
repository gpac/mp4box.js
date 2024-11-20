import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class txtcBox extends FullBox {
  config: string;

  constructor(size?: number) {
    super('txtc', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.config = stream.readCString();
  }
}

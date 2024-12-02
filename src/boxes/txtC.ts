import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class txtcBox extends FullBox {
  config: string;

  type = 'txtc' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.config = stream.readCString();
  }
}

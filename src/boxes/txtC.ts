import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class txtcBox extends FullBox {
  static fourcc = 'txtc' as const;
  box_name = 'TextConfigBox' as const;

  config: string;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.config = stream.readCString();
  }
}

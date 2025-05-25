import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class txtcBox extends FullBox {
  type = 'txtc' as const;
  box_name = 'TextConfigBox'

  config: string;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.config = stream.readCString();
  }
}

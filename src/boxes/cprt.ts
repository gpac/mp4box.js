import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class cprtBox extends FullBox {
  type = 'cprt' as const;
  box_name = 'CopyrightBox';

  notice: string;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.parseLanguage(stream);
    this.notice = stream.readCString();
  }
}

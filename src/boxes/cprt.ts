import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class cprtBox extends FullBox {
  notice: string;

  type = 'cprt' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.parseLanguage(stream);
    this.notice = stream.readCString();
  }
}

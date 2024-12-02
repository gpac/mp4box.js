import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class udesBox extends FullBox {
  lang: string;
  name: string;
  description: string;
  tags: string;

  type = 'udes' as const;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.lang = stream.readCString();
    this.name = stream.readCString();
    this.description = stream.readCString();
    this.tags = stream.readCString();
  }
}

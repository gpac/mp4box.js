import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class udesBox extends FullBox {
  static fourcc = 'udes' as const;
  box_name = 'UserDescriptionProperty' as const;

  lang: string;
  name: string;
  description: string;
  tags: string;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.lang = stream.readCString();
    this.name = stream.readCString();
    this.description = stream.readCString();
    this.tags = stream.readCString();
  }
}

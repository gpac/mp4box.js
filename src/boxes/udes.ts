import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class udesBox extends FullBox {
  type = 'udes' as const;
  box_name = 'UserDescriptionProperty';

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

import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class cschBox extends FullBox {
  static override readonly fourcc = 'csch' as const;
  box_name = 'CompatibleSchemeTypeBox' as const;

  scheme_type: string;
  scheme_version: number;
  scheme_uri: string;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.scheme_type = stream.readString(4);
    this.scheme_version = stream.readUint32();
    if (this.flags & 0x000001) {
      this.scheme_uri = stream.readCString();
    }
  }
}

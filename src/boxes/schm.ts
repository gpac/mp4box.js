import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class schmBox extends FullBox {
  scheme_type: string;
  scheme_version: number;
  scheme_uri: string;

  type = 'schm' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.scheme_type = stream.readString(4);
    this.scheme_version = stream.readUint32();
    if (this.flags & 0x000001) {
      this.scheme_uri = stream.readString(this.size - this.hdr_size - 8);
    }
  }
}

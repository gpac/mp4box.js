import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class kindBox extends FullBox {
  static override readonly fourcc = 'kind' as const;
  box_name = 'KindBox' as const;

  schemeURI: string;
  value: string;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.schemeURI = stream.readCString();
    if (!this.isEndOfBox(stream)) {
      this.value = stream.readCString();
    }
  }

  /** @bundle writing/kind.js */
  write(stream: MultiBufferStream) {
    this.version = 0;
    this.flags = 0;
    this.size = this.schemeURI.length + 1 + (this.value ? this.value.length + 1 : 0);
    this.writeHeader(stream);
    stream.writeCString(this.schemeURI);
    if (this.value) stream.writeCString(this.value);
  }
}

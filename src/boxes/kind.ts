import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class kindBox extends FullBox {
  schemeURI: string;
  value: string;

  type = 'kind' as const;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.schemeURI = stream.readCString();
    this.value = stream.readCString();
  }

  /** @bundle writing/kind.js */
  write(stream: MultiBufferStream) {
    this.version = 0;
    this.flags = 0;
    this.size = this.schemeURI.length + 1 + (this.value.length + 1);
    this.writeHeader(stream);
    stream.writeCString(this.schemeURI);
    stream.writeCString(this.value);
  }
}

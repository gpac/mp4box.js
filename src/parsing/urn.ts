import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class urnBox extends FullBox {
  name?: string;
  location?: string;

  constructor(size?: number) {
    super('urn', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.name = stream.readCString();
    if (this.size - this.hdr_size - this.name.length - 1 > 0) {
      this.location = stream.readCString();
    }
  }

  /** @bundle writing/urn.js */
  write(stream: MultiBufferStream) {
    this.version = 0;
    this.flags = 0;
    this.size = this.name.length + 1 + (this.location ? this.location.length + 1 : 0);
    this.writeHeader(stream);
    stream.writeCString(this.name);
    if (this.location) {
      stream.writeCString(this.location);
    }
  }
}

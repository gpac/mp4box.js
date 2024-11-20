import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class elngBox extends FullBox {
  extended_language: string;

  constructor(size?: number) {
    super('elng', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.extended_language = stream.readString(this.size - this.hdr_size);
  }

  /** @bundle writing/elng.js */
  write(stream: MultiBufferStream) {
    this.version = 0;
    this.flags = 0;
    this.size = this.extended_language.length;
    this.writeHeader(stream);
    stream.writeString(this.extended_language);
  }
}

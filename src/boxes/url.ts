import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class urlBox extends FullBox {
  static override readonly fourcc = 'url ' as const;
  box_name = 'DataEntryUrlBox' as const;

  location?: string;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.flags !== 0x000001) {
      this.location = stream.readCString();
    }
  }

  /** @bundle writing/url.js */
  write(stream: MultiBufferStream) {
    this.version = 0;
    if (this.location) {
      this.flags = 0;
      this.size = this.location.length + 1;
    } else {
      this.flags = 0x000001;
      this.size = 0;
    }
    this.writeHeader(stream);
    if (this.location) {
      stream.writeCString(this.location);
    }
  }
}

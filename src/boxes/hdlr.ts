import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class hdlrBox extends FullBox {
  static override readonly fourcc = 'hdlr' as const;
  box_name = 'HandlerBox' as const;

  version: number;
  handler: string;
  name: string;
  flags: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.version === 0) {
      stream.readUint32();
      this.handler = stream.readString(4);
      stream.readUint32Array(3);
      if (!this.isEndOfBox(stream)) {
        this.name = stream.readCString();
      }
    }
  }

  /** @bundle writing/hldr.js */
  write(stream: MultiBufferStream) {
    this.size = 5 * 4 + this.name.length + 1;
    this.version = 0;
    this.flags = 0;
    this.writeHeader(stream);
    stream.writeUint32(0);
    stream.writeString(this.handler, null, 4);
    stream.writeUint32Array([0, 0, 0]); // reserved
    stream.writeCString(this.name);
  }
}

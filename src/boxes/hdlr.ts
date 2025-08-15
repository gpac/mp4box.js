import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { Log } from '#/log';

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
        const name_size = this.start + this.size - stream.getPosition();
        this.name = stream.readCString();

        // Check if last byte was null-terminator indeed
        const end = this.start + this.size - 1;
        stream.seek(end);
        const lastByte = stream.readUint8();
        if (lastByte !== 0 && name_size > 1) {
          Log.info(
            'BoxParser',
            'Warning: hdlr name is not null-terminated, possibly length-prefixed string. Trimming first byte.',
          );
          this.name = this.name.slice(1);
        }
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
    stream.writeString(this.handler, undefined, 4);
    stream.writeUint32Array([0, 0, 0]); // reserved
    stream.writeCString(this.name);
  }
}

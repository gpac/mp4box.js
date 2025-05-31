import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class mdhdBox extends FullBox {
  static override fourcc = 'mdhd' as const;
  box_name = 'MediaHeaderBox' as const;

  creation_time: number;
  modification_time: number;
  timescale: number;
  duration: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.version === 1) {
      this.creation_time = stream.readUint64();
      this.modification_time = stream.readUint64();
      this.timescale = stream.readUint32();
      this.duration = stream.readUint64();
    } else {
      this.creation_time = stream.readUint32();
      this.modification_time = stream.readUint32();
      this.timescale = stream.readUint32();
      this.duration = stream.readUint32();
    }
    this.parseLanguage(stream);
    stream.readUint16();
  }

  /** @bundle writing/mdhd.js */
  write(stream: MultiBufferStream) {
    this.size = 4 * 4 + 2 * 2;
    this.flags = 0;
    this.version = 0;
    this.writeHeader(stream);
    stream.writeUint32(this.creation_time);
    stream.writeUint32(this.modification_time);
    stream.writeUint32(this.timescale);
    stream.writeUint32(this.duration);
    stream.writeUint16(this.language);
    stream.writeUint16(0);
  }
}

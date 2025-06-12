import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { MAX_SIZE } from '#/constants';

export class mdhdBox extends FullBox {
  static override readonly fourcc = 'mdhd' as const;
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
    const useVersion1 =
      this.modification_time > MAX_SIZE ||
      this.creation_time > MAX_SIZE ||
      this.duration > MAX_SIZE ||
      this.version === 1;
    this.version = useVersion1 ? 1 : 0;

    this.size = 4 * 4 + 2 * 2;
    this.size += useVersion1 ? 3 * 4 : 0; // creation_time, modification_time, duration

    this.flags = 0;
    this.writeHeader(stream);

    if (useVersion1) {
      stream.writeUint64(this.creation_time);
      stream.writeUint64(this.modification_time);
      stream.writeUint32(this.timescale);
      stream.writeUint64(this.duration);
    } else {
      stream.writeUint32(this.creation_time);
      stream.writeUint32(this.modification_time);
      stream.writeUint32(this.timescale);
      stream.writeUint32(this.duration);
    }

    stream.writeUint16(this.language);
    stream.writeUint16(0);
  }
}

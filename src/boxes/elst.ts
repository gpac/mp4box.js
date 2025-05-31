import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import type { Entry } from '@types';

export class elstBox extends FullBox {
  static override fourcc = 'elst' as const;
  box_name = 'EditListBox' as const;

  entries: Array<Entry>;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.entries = [];
    const entry_count = stream.readUint32();
    for (let i = 0; i < entry_count; i++) {
      const entry: Entry = {
        segment_duration: this.version === 1 ? stream.readUint64() : stream.readUint32(),
        media_time: this.version === 1 ? stream.readInt64() : stream.readInt32(),
        media_rate_integer: stream.readInt16(),
        media_rate_fraction: stream.readInt16(),
      };
      this.entries.push(entry);
    }
  }

  /** @bundle writing/elst.js */
  write(stream: MultiBufferStream) {
    this.version = 0;
    this.flags = 0;
    this.size = 4 + 12 * this.entries.length;
    this.writeHeader(stream);
    stream.writeUint32(this.entries.length);
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      stream.writeUint32(entry.segment_duration);
      stream.writeInt32(entry.media_time);
      stream.writeInt16(entry.media_rate_integer);
      stream.writeInt16(entry.media_rate_fraction);
    }
  }
}

import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

interface Entry {
  sample_count: number;
  group_description_index: number;
}

export class sbgpBox extends FullBox {
  static override readonly fourcc = 'sbgp' as const;
  box_name = 'SampleToGroupBox' as const;

  grouping_type: string;
  grouping_type_parameter: number;
  entries: Array<Entry>;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.grouping_type = stream.readString(4);
    if (this.version === 1) {
      this.grouping_type_parameter = stream.readUint32();
    } else {
      this.grouping_type_parameter = 0;
    }
    this.entries = [];
    const entry_count = stream.readUint32();
    for (let i = 0; i < entry_count; i++) {
      this.entries.push({
        sample_count: stream.readInt32(),
        group_description_index: stream.readInt32(),
      });
    }
  }

  /** @bundle writing/sbgp.js */
  write(stream: MultiBufferStream) {
    if (this.grouping_type_parameter) this.version = 1;
    else this.version = 0;
    this.flags = 0;
    this.size = 8 + 8 * this.entries.length + (this.version === 1 ? 4 : 0);
    this.writeHeader(stream);
    stream.writeString(this.grouping_type, null, 4);
    if (this.version === 1) {
      stream.writeUint32(this.grouping_type_parameter);
    }
    stream.writeUint32(this.entries.length);
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      stream.writeInt32(entry.sample_count);
      stream.writeInt32(entry.group_description_index);
    }
  }
}

import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

interface Entry {
  sample_count: number;
  group_description_index: number;
}

export class sbgpBox extends FullBox {
  type = 'sbgp' as const;
  box_name = 'SampleToGroupBox'

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
    this.version = 1;
    this.flags = 0;
    this.size = 12 + 8 * this.entries.length;
    this.writeHeader(stream);
    stream.writeString(this.grouping_type, null, 4);
    stream.writeUint32(this.grouping_type_parameter);
    stream.writeUint32(this.entries.length);
    for (let i = 0; i < this.entries.length; i++) {
      let entry = this.entries[i];
      stream.writeInt32(entry.sample_count);
      stream.writeInt32(entry.group_description_index);
    }
  }
}

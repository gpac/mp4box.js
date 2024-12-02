import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class cdefBox extends Box {
  channel_count: number;
  channel_indexes: Array<number>;
  channel_types: Array<number>;
  channel_associations: Array<number>;

  type = 'cdef' as const;

  parse(stream: MultiBufferStream) {
    this.channel_count = stream.readUint16();
    this.channel_indexes = [];
    this.channel_types = [];
    this.channel_associations = [];
    for (let i = 0; i < this.channel_count; i++) {
      this.channel_indexes.push(stream.readUint16());
      this.channel_types.push(stream.readUint16());
      this.channel_associations.push(stream.readUint16());
    }
  }
}

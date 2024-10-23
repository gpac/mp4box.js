import { Box } from '../box';
import type { MultiBufferStream } from '../buffer';

export class ipmaBox extends Box {
  associations?: unknown[];
  version?: number;
  flags?: number;

  constructor(size?: number) {
    super('ipma', size);
  }

  parse(stream: MultiBufferStream) {
    const entry_count = stream.readUint32();
    this.associations = [];
    for (let i = 0; i < entry_count; i++) {
      var item_assoc = {};
      this.associations.push(item_assoc);
      if (this.version < 1) {
        item_assoc.id = stream.readUint16();
      } else {
        item_assoc.id = stream.readUint32();
      }
      var association_count = stream.readUint8();
      item_assoc.props = [];
      for (let j = 0; j < association_count; j++) {
        var tmp = stream.readUint8();
        var p = {};
        item_assoc.props.push(p);
        p.essential = (tmp & 0x80) >> 7 === 1;
        if (this.flags & 0x1) {
          p.property_index = ((tmp & 0x7f) << 8) | stream.readUint8();
        } else {
          p.property_index = tmp & 0x7f;
        }
      }
    }
  }
}

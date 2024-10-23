import { Box } from '../box';
import { BoxParser } from '../box-parser';
import type { MultiBufferStream } from '../buffer';
import { Log } from '../log';

export class iinfBox extends Box {
  version?: number;
  entry_count?: number;
  item_infos?: unknown[];

  constructor(size?: number) {
    super('iinf', size);
  }

  parse(stream: MultiBufferStream) {
    var ret;

    if (this.version === 0) {
      this.entry_count = stream.readUint16();
    } else {
      this.entry_count = stream.readUint32();
    }

    this.item_infos = [];

    for (var i = 0; i < this.entry_count; i++) {
      ret = BoxParser.parseOneBox(stream, false, this.size - (stream.getPosition() - this.start));
      if (ret.code === BoxParser.OK) {
        if (ret.box.type !== 'infe') {
          Log.error('BoxParser', "Expected 'infe' box, got " + ret.box.type);
        }
        this.item_infos[i] = ret.box;
      } else {
        return;
      }
    }
  }
}

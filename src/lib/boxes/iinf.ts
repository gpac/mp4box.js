import { Box, parseOneBox } from '#/box';
import { MultiBufferStream } from '#/buffer';
import { OK } from '#/constants';
import { Log } from '#/log';

export interface ItemInfo {
  item_ID: number;
  protection_index: number;
  item_type: unknown;
  item_name: string;
  content_type: unknown;
  content_encoding: unknown;
}

export class iinfBox extends Box {
  version?: number;
  entry_count?: number;
  item_infos?: Array<ItemInfo>;

  constructor(size?: number) {
    super('iinf', size);
  }

  parse(stream: MultiBufferStream) {
    if (this.version === 0) {
      this.entry_count = stream.readUint16();
    } else {
      this.entry_count = stream.readUint32();
    }

    this.item_infos = [];

    for (let i = 0; i < this.entry_count; i++) {
      const ret = parseOneBox(stream, false, this.size - (stream.getPosition() - this.start));
      if (ret.code === OK) {
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

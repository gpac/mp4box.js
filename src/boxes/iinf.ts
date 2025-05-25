import { FullBox, parseOneBox } from '#/box';
import { infeBox } from '#/boxes/infe';
import type { MultiBufferStream } from '#/buffer';
import { OK } from '#/constants';
import { Log } from '#/log';
import type { BoxKind } from '@types';

export class iinfBox extends FullBox {
  type = 'iinf' as const;
  box_name = 'ItemInfoBox';

  version: number;
  entry_count: number;
  item_infos: Array<infeBox>;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.version === 0) {
      this.entry_count = stream.readUint16();
    } else {
      this.entry_count = stream.readUint32();
    }

    this.item_infos = [];

    for (let i = 0; i < this.entry_count; i++) {
      const ret = parseOneBox(stream, false, this.size - (stream.getPosition() - this.start));
      if (ret.code === OK) {
        const box = ret.box as BoxKind;
        if (box.type === 'infe') {
          this.item_infos[i] = box;
        } else {
          Log.error('BoxParser', "Expected 'infe' box, got " + ret.box.type);
        }
      } else {
        return;
      }
    }
  }
}

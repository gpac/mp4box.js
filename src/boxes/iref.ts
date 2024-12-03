import {
  Box,
  SingleItemTypeReferenceBox,
  SingleItemTypeReferenceBoxLarge,
  parseOneBox,
} from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { OK } from '#/constants';
import { Log } from '#/log';
import type { Reference } from '@types';

export class irefBox extends Box {
  references: { references: Array<Reference>; from_item_ID: number; type: string }[];
  version: number;

  type = 'iref' as const;

  parse(stream: MultiBufferStream) {
    this.references = [];

    while (stream.getPosition() < this.start + this.size) {
      const ret = parseOneBox(stream, true, this.size - (stream.getPosition() - this.start));
      if (ret.code === OK) {
        const box =
          this.version === 0
            ? new SingleItemTypeReferenceBox(ret.type, ret.size, ret.hdr_size, ret.start)
            : new SingleItemTypeReferenceBoxLarge(ret.type, ret.size, ret.hdr_size, ret.start);

        if (box.write === Box.prototype.write && box.type !== 'mdat') {
          Log.warn(
            'BoxParser',
            box.type +
              ' box writing not yet implemented, keeping unparsed data in memory for later write',
          );
          box.parseDataAndRewind(stream);
        }
        box.parse(stream);
        this.references.push(box);
      } else {
        return;
      }
    }
  }
}

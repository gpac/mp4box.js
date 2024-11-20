import {
  Box,
  SingleItemTypeReferenceBox,
  SingleItemTypeReferenceBoxLarge,
  parseOneBox,
} from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { OK } from '#/constants';
import { Log } from '#/log';
import { MP4BoxStream } from '#/stream';

export class irefBox extends Box {
  references: { references: Array<unknown>; from_item_ID: number; type: unknown }[];
  version: number;

  constructor(size?: number) {
    super('iref', size);
  }

  parse(stream: MultiBufferStream | MP4BoxStream) {
    let ret;
    let box;
    this.references = [];

    while (stream.getPosition() < this.start + this.size) {
      ret = parseOneBox(stream, true, this.size - (stream.getPosition() - this.start));
      if (ret.code === OK) {
        if (this.version === 0) {
          box = new SingleItemTypeReferenceBox(ret.type, ret.size, ret.hdr_size, ret.start);
        } else {
          box = new SingleItemTypeReferenceBoxLarge(ret.type, ret.size, ret.hdr_size, ret.start);
        }
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

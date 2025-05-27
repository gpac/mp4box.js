import {
  Box,
  FullBox,
  SingleItemTypeReferenceBox,
  SingleItemTypeReferenceBoxLarge,
  parseOneBox,
} from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { OK } from '#/constants';
import { Log } from '#/log';
import type { Reference } from '@types';

const REFERENCE_TYPE_NAMES = {
  auxl: 'Auxiliary image item',
  base: 'Pre-derived image item base',
  cdsc: 'Item describes referenced item',
  dimg: 'Derived image item',
  dpnd: 'Item coding dependency',
  eroi: 'Region',
  evir: 'EVC slice',
  exbl: 'Scalable image item',
  'fdl ': 'File delivery',
  font: 'Font item',
  iloc: 'Item data location',
  mask: 'Region mask',
  mint: 'Data integrity',
  pred: 'Predictively coded item',
  prem: 'Pre-multiplied item',
  tbas: 'HEVC tile track base item',
  thmb: 'Thumbnail image item',
};

export class irefBox extends FullBox {
  type = 'iref' as const;
  box_name = 'ItemReferenceBox';

  references: Array<{ references: Array<Reference>; from_item_ID: number; type: string }>;
  version: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.references = [];

    while (stream.getPosition() < this.start + this.size) {
      const ret = parseOneBox(stream, true, this.size - (stream.getPosition() - this.start));
      if (ret.code === OK) {
        const name = REFERENCE_TYPE_NAMES[ret.type];
        const box =
          this.version === 0
            ? new SingleItemTypeReferenceBox(ret.type, ret.size, name, ret.hdr_size, ret.start)
            : new SingleItemTypeReferenceBoxLarge(
                ret.type,
                ret.size,
                name,
                ret.hdr_size,
                ret.start,
              );

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

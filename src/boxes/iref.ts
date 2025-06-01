import { Box, FullBox, SingleItemTypeReferenceBox, SingleItemTypeReferenceBoxLarge } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { OK } from '#/constants';
import { Log } from '#/log';
import { parseOneBox } from '#/parser';

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
  static override readonly fourcc = 'iref' as const;
  box_name = 'ItemReferenceBox' as const;

  static allowed_types = [
    'auxl',
    'base',
    'cdsc',
    'dimg',
    'dpnd',
    'eroi',
    'evir',
    'exbl',
    'fdl ',
    'font',
    'iloc',
    'mask',
    'mint',
    'pred',
    'prem',
    'tbas',
    'thmb',
  ] as const;

  references: Array<SingleItemTypeReferenceBox | SingleItemTypeReferenceBoxLarge> = [];
  version: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.references = [];

    while (stream.getPosition() < this.start + this.size) {
      const ret = parseOneBox(stream, true, this.size - (stream.getPosition() - this.start));
      if (ret.code === OK) {
        let name = 'Unknown item reference';
        if (!irefBox.allowed_types.includes(ret.type as (typeof irefBox.allowed_types)[number])) {
          Log.warn('BoxParser', `Unknown item reference type: '${ret.type}'`);
        } else name = REFERENCE_TYPE_NAMES[ret.type];

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

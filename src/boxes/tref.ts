import { OK } from '#//constants';
import { Box, TrackReferenceTypeBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { Log } from '#/log';
import { parseOneBox } from '#/parser';

export class trefBox extends Box {
  static override readonly fourcc = 'tref' as const;
  box_name = 'TrackReferenceBox' as const;

  static allowed_types = [
    'hint',
    'cdsc',
    'font',
    'hind',
    'vdep',
    'vplx',
    'subt',
    'thmb',
    'auxl',
    'cdtg',
    'shsc',
    'aest',
  ] as const;

  boxes: Array<TrackReferenceTypeBox> = [];

  parse(stream: MultiBufferStream) {
    while (stream.getPosition() < this.start + this.size) {
      const ret = parseOneBox(stream, true, this.size - (stream.getPosition() - this.start));
      if (ret.code === OK) {
        if (!trefBox.allowed_types.includes(ret.type as (typeof trefBox.allowed_types)[number])) {
          Log.warn('BoxParser', `Unknown track reference type: '${ret.type}'`);
        }

        const box = new TrackReferenceTypeBox(ret.type, ret.size, ret.hdr_size, ret.start);
        if (box.write === Box.prototype.write && box.type !== 'mdat') {
          Log.info(
            'BoxParser',
            'TrackReference ' +
              box.type +
              ' box writing not yet implemented, keeping unparsed data in memory for later write',
          );
          box.parseDataAndRewind(stream);
        }
        box.parse(stream);
        this.boxes.push(box);
      } else {
        return;
      }
    }
  }
}

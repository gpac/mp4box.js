import { OK } from '#//constants';
import { Box, ContainerBox, parseOneBox, TrackReferenceTypeBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { Log } from '#/log';

export class trefBox extends ContainerBox {
  type = 'tref' as const;

  declare boxes: Array<TrackReferenceTypeBox>;

  parse(stream: MultiBufferStream) {
    while (stream.getPosition() < this.start + this.size) {
      const ret = parseOneBox(stream, true, this.size - (stream.getPosition() - this.start));
      if (ret.code === OK) {
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
        if (!this.boxes)
          this.boxes = [];
        this.boxes.push(box);
      } else {
        return;
      }
    }
  }
}

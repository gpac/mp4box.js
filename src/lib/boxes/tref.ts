import { OK } from '#//constants';
import { Box, parseOneBox, TrackReferenceTypeBox } from '#/box';
import { MultiBufferStream } from '#/buffer';
import { Log } from '#/log';

// NOTE:    This previously did not have a class constructor
//          So I am not sure if this should extend from Box/FullBox/...
export class trefBox extends Box {
  constructor(size?: number) {
    super('tref', size);
  }

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
        this.boxes.push(box);
      } else {
        return;
      }
    }
  }
}

import { Box, SingleItemTypeReferenceBox, SingleItemTypeReferenceBoxLarge } from '../box';
import { BoxParser } from '../box-parser';
import { MultiBufferStream } from '../buffer';
import { Log } from '../log';

export class irefBox extends Box {
  references?: unknown[];
  version?: number;

  constructor(size?: number) {
    super('iref', size);
  }

  parse(stream: MultiBufferStream) {
    let ret;
    let box;
    this.references = [];

    while (stream.getPosition() < this.start + this.size) {
      ret = BoxParser.parseOneBox(stream, true, this.size - (stream.getPosition() - this.start));
      if (ret.code === BoxParser.OK) {
        if (this.version === 0) {
          box = new SingleItemTypeReferenceBox(ret.type, ret.size, ret.hdr_size, ret.start);
        } else {
          box = new SingleItemTypeReferenceBoxLarge(ret.type, ret.size, ret.hdr_size, ret.start);
        }
        if (box.write === BoxParser.Box.prototype.write && box.type !== 'mdat') {
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

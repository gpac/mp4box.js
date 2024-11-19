import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';
import { parseOneBox } from '../box-parse';
import { OK } from '../constants';

export class trepBox extends FullBox {
  track_ID?: number;

  constructor(size?: number) {
    super('trep', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.track_ID = stream.readUint32();
    this.boxes = [];
    while (stream.getPosition() < this.start + this.size) {
      let ret = parseOneBox(stream, false, this.size - (stream.getPosition() - this.start));
      if (ret.code === OK) {
        let box = ret.box;
        this.boxes.push(box);
      } else {
        return;
      }
    }
  }
}

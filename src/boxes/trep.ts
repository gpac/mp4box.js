import { FullBox, parseOneBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { OK } from '#/constants';

export class trepBox extends FullBox {
  type = 'trep' as const;

  track_ID: number;

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

import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { OK } from '#/constants';
import { parseOneBox } from '#/parser';

export class trepBox extends FullBox {
  static fourcc = 'trep' as const;
  box_name = 'TrackExtensionPropertiesBox' as const;

  track_ID: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.track_ID = stream.readUint32();
    this.boxes = [];
    while (stream.getPosition() < this.start + this.size) {
      const ret = parseOneBox(stream, false, this.size - (stream.getPosition() - this.start));
      if (ret.code === OK) {
        const box = ret.box;
        this.boxes.push(box);
      } else {
        return;
      }
    }
  }
}

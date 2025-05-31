import { FullBox, parseOneBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { OK } from '#/constants';
import type { BoxKind } from '@types';

export class stviBox extends FullBox {
  static fourcc = 'stvi' as const;
  box_name = 'StereoVideoBox' as const;

  single_view_allowed: number;
  stereo_scheme: number;
  stereo_indication_type: string;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    const tmp32 = stream.readUint32();
    this.single_view_allowed = tmp32 & 0x3;
    this.stereo_scheme = stream.readUint32();
    const length = stream.readUint32();
    this.stereo_indication_type = stream.readString(length);
    this.boxes = [];
    while (stream.getPosition() < this.start + this.size) {
      const ret = parseOneBox(stream, false, this.size - (stream.getPosition() - this.start));
      if (ret.code === OK) {
        const box = ret.box as BoxKind;
        this.boxes.push(box);
        this[box.type] = box;
      } else {
        return;
      }
    }
  }
}

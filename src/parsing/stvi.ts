import { FullBox } from '#/box';
import { parseOneBox } from '#/box-parse';
import { MultiBufferStream } from '#/buffer';
import { OK } from '#/constants';

export class stviBox extends FullBox {
  single_view_allowed?: number;
  stereo_scheme?: number;
  stereo_indication_type?: string;

  constructor(size?: number) {
    super('stvi', size);
  }

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
        const box = ret.box;
        this.boxes.push(box);
        this[box.type] = box;
      } else {
        return;
      }
    }
  }
}

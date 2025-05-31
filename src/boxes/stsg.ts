import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class stsgBox extends FullBox {
  static fourcc = 'stsg' as const;
  box_name = 'SubTrackSampleGroupBox' as const;

  grouping_type: number;
  group_description_index: Array<number>;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.grouping_type = stream.readUint32();
    const count = stream.readUint16();
    this.group_description_index = [];
    for (let i = 0; i < count; i++) {
      this.group_description_index[i] = stream.readUint32();
    }
  }
}

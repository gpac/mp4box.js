import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class tselBox extends FullBox {
  type = 'tsel' as const;
  box_name = 'TrackSelectionBox';

  switch_group: number;
  attribute_list: Array<number>;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.switch_group = stream.readUint32();
    const count = (this.size - this.hdr_size - 4) / 4;
    this.attribute_list = [];
    for (let i = 0; i < count; i++) {
      this.attribute_list[i] = stream.readUint32();
    }
  }
}

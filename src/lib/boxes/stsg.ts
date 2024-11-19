import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class stsgBox extends FullBox {
  grouping_type?: number;
  group_description_index?: number[];

  constructor(size?: number) {
    super('stsg', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.grouping_type = stream.readUint32();
    const count = stream.readUint16();
    this.group_description_index = [];
    for (var i = 0; i < count; i++) {
      this.group_description_index[i] = stream.readUint32();
    }
  }
}

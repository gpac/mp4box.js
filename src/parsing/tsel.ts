import { FullBox } from '../box';
import type { MultiBufferStream } from '../buffer';

export class tselBox extends FullBox {
  switch_group?: number;
  attribute_list?: number[];

  constructor(size?: number) {
    super('tsel', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.switch_group = stream.readUint32();
    var count = (this.size - this.hdr_size - 4) / 4;
    this.attribute_list = [];
    for (var i = 0; i < count; i++) {
      this.attribute_list[i] = stream.readUint32();
    }
  }
}

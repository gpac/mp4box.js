import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class striBox extends FullBox {
  switch_group?: number;
  alternate_group?: number;
  sub_track_id?: number;
  attribute_list?: number[];

  constructor(size?: number) {
    super('stri', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.switch_group = stream.readUint16();
    this.alternate_group = stream.readUint16();
    this.sub_track_id = stream.readUint32();
    var count = (this.size - this.hdr_size - 8) / 4;
    this.attribute_list = [];
    for (var i = 0; i < count; i++) {
      this.attribute_list[i] = stream.readUint32();
    }
  }
}

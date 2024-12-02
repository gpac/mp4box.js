import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class saioBox extends FullBox {
  aux_info_type: number;
  aux_info_type_parameter: number;
  offset: Array<number>;

  type = 'saio' as const;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.flags & 0x1) {
      this.aux_info_type = stream.readUint32();
      this.aux_info_type_parameter = stream.readUint32();
    }
    const count = stream.readUint32();
    this.offset = [];
    for (let i = 0; i < count; i++) {
      if (this.version === 0) {
        this.offset[i] = stream.readUint32();
      } else {
        this.offset[i] = stream.readUint64();
      }
    }
  }
}

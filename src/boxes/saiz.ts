import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class saizBox extends FullBox {
  aux_info_type: number;
  aux_info_type_parameter: number;
  default_sample_info_size: number;
  sample_info_size: Array<number>;

  type = 'saiz' as const;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.flags & 0x1) {
      this.aux_info_type = stream.readUint32();
      this.aux_info_type_parameter = stream.readUint32();
    }
    this.default_sample_info_size = stream.readUint8();
    const count = stream.readUint32();
    this.sample_info_size = [];
    if (this.default_sample_info_size === 0) {
      for (let i = 0; i < count; i++) {
        this.sample_info_size[i] = stream.readUint8();
      }
    }
  }
}

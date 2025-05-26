import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class saizBox extends FullBox {
  type = 'saiz' as const;
  box_name = 'SampleAuxiliaryInformationSizesBox';

  aux_info_type: string;
  aux_info_type_parameter: number;
  default_sample_info_size: number;
  sample_count: number;
  sample_info_size: number[];

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.flags & 0x1) {
      this.aux_info_type = stream.readString(4);
      this.aux_info_type_parameter = stream.readUint32();
    }
    this.default_sample_info_size = stream.readUint8();
    this.sample_count = stream.readUint32();
    this.sample_info_size = [];
    if (this.default_sample_info_size === 0) {
      for (let i = 0; i < this.sample_count; i++) {
        this.sample_info_size[i] = stream.readUint8();
      }
    }
  }
}

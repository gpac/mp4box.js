import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class uncCBox extends FullBox {
  profile?: number;
  component_count?: number;
  component_index?: number[];
  component_bit_depth_minus_one?: number[];
  component_format?: number[];
  component_align_size?: number[];
  sampling_type?: number;
  interleave_type?: number;
  block_size?: number;
  component_little_endian?: number;
  block_pad_lsb?: number;
  block_little_endian?: number;
  block_reversed?: number;
  pad_unknown?: number;
  pixel_size?: number;
  row_align_size?: number;
  tile_align_size?: number;
  num_tile_cols_minus_one?: number;
  num_tile_rows_minus_one?: number;

  constructor(size?: number) {
    super('uncC', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.profile = stream.readUint32();
    if (this.version == 1) {
      // Nothing - just the profile
    } else if (this.version == 0) {
      this.component_count = stream.readUint32();
      this.component_index = [];
      this.component_bit_depth_minus_one = [];
      this.component_format = [];
      this.component_align_size = [];
      for (let i = 0; i < this.component_count; i++) {
        this.component_index.push(stream.readUint16());
        this.component_bit_depth_minus_one.push(stream.readUint8());
        this.component_format.push(stream.readUint8());
        this.component_align_size.push(stream.readUint8());
      }
      this.sampling_type = stream.readUint8();
      this.interleave_type = stream.readUint8();
      this.block_size = stream.readUint8();
      var flags = stream.readUint8();
      this.component_little_endian = (flags >> 7) & 0x1;
      this.block_pad_lsb = (flags >> 6) & 0x1;
      this.block_little_endian = (flags >> 5) & 0x1;
      this.block_reversed = (flags >> 4) & 0x1;
      this.pad_unknown = (flags >> 3) & 0x1;
      this.pixel_size = stream.readUint32();
      this.row_align_size = stream.readUint32();
      this.tile_align_size = stream.readUint32();
      this.num_tile_cols_minus_one = stream.readUint32();
      this.num_tile_rows_minus_one = stream.readUint32();
    }
  }
}

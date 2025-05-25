import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class colrBox extends Box {
  type = 'colr' as const;
  box_name = 'ColourInformationBox';

  colour_type: string;
  colour_primaries: number;
  transfer_characteristics: number;
  matrix_coefficients: number;
  full_range_flag: number;
  ICC_profile: Uint8Array;

  parse(stream: MultiBufferStream) {
    this.colour_type = stream.readString(4);
    if (this.colour_type === 'nclx') {
      this.colour_primaries = stream.readUint16();
      this.transfer_characteristics = stream.readUint16();
      this.matrix_coefficients = stream.readUint16();
      const tmp = stream.readUint8();
      this.full_range_flag = tmp >> 7;
    } else if (this.colour_type === 'rICC') {
      this.ICC_profile = stream.readUint8Array(this.size - 4);
    } else if (this.colour_type === 'prof') {
      this.ICC_profile = stream.readUint8Array(this.size - 4);
    }
  }
}

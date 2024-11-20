import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class cminBox extends Box {
  focal_length_x: number;
  principal_point_x: number;
  principal_point_y: number;
  flags: number;
  focal_length_y: number;
  skew_factor: number;

  constructor(size?: number) {
    super('cmin', size);
  }

  parse(stream: MultiBufferStream) {
    this.focal_length_x = stream.readInt32();
    this.principal_point_x = stream.readInt32();
    this.principal_point_y = stream.readInt32();
    if (this.flags & 0x1) {
      this.focal_length_y = stream.readInt32();
      this.skew_factor = stream.readInt32();
    }
  }
}

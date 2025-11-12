import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import type { BitStream } from '#/bitstream';

export class ndwtBox extends Box {
  static override readonly fourcc = 'ndwt' as const;
  box_name = 'NominalDiffuseWhite' as const;

  diffuse_white_luminance: number;

  parse(stream: MultiBufferStream | BitStream) {
    this.diffuse_white_luminance = stream.readUint32();
  }
}

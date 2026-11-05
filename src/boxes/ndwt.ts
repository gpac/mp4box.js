import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class ndwtBox extends FullBox {
  static override readonly fourcc = 'ndwt' as const;
  box_name = 'NominalDiffuseWhite' as const;

  diffuse_white_luminance: number;

  parse_body(stream: MultiBufferStream) {
    this.diffuse_white_luminance = stream.readUint32();
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.parse_body(stream);
  }
}

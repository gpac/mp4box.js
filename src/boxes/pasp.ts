import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class paspBox extends Box {
  static fourcc = 'pasp' as const;
  box_name = 'PixelAspectRatioBox' as const;

  hSpacing: number;
  vSpacing: number;

  parse(stream: MultiBufferStream) {
    this.hSpacing = stream.readUint32();
    this.vSpacing = stream.readUint32();
  }
}

import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class irotBox extends Box {
  static fourcc = 'irot' as const;
  box_name = 'ImageRotation' as const;

  angle: number;

  parse(stream: MultiBufferStream) {
    this.angle = stream.readUint8() & 0x3;
  }
}

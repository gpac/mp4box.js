import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class irotBox extends Box {
  angle: number;

  type = 'irot' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.angle = stream.readUint8() & 0x3;
  }
}

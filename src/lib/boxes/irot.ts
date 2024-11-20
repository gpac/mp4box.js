import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class irotBox extends Box {
  angle: number;

  constructor(size?: number) {
    super('irot', size);
  }

  parse(stream: MultiBufferStream) {
    this.angle = stream.readUint8() & 0x3;
  }
}

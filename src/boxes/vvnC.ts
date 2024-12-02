import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class vvnCBox extends FullBox {
  lengthSizeMinusOne: number | undefined;

  type = 'vvnC' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    // VvcNALUConfigBox
    const tmp = stream.readUint8();
    this.lengthSizeMinusOne = tmp & 0x3;
  }
}

import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class vvnCBox extends FullBox {
  type = 'vvnC' as const;

  lengthSizeMinusOne: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    // VvcNALUConfigBox
    const tmp = stream.readUint8();
    this.lengthSizeMinusOne = tmp & 0x3;
  }
}

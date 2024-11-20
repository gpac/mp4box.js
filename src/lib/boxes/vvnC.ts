import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class vvnCBox extends FullBox {
  lengthSizeMinusOne: number | undefined;

  constructor(size?: number) {
    super('vvnC', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    // VvcNALUConfigBox
    const tmp = stream.readUint8();
    this.lengthSizeMinusOne = tmp & 0x3;
  }
}

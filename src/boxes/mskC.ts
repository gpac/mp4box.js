import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class mskCBox extends FullBox {
  bits_per_pixel: number;

  constructor(size?: number) {
    super('mskC', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.bits_per_pixel = stream.readUint8();
  }
}

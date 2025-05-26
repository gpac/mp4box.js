import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class mskCBox extends FullBox {
  type = 'mskC' as const;
  box_name = 'MaskConfigurationProperty';

  bits_per_pixel: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.bits_per_pixel = stream.readUint8();
  }
}

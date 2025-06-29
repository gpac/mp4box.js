import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class prfrBox extends FullBox {
  static override readonly fourcc = 'prfr' as const;
  box_name = 'ProjectionFormatBox' as const;

  projection_type: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.projection_type = stream.readUint8() & 0b00011111;
  }
}

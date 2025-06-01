import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class fielBox extends Box {
  static override readonly fourcc = 'fiel' as const;
  box_name = 'FieldHandlingBox' as const;

  fieldCount: number;
  fieldOrdering: number;

  parse(stream: MultiBufferStream) {
    this.fieldCount = stream.readUint8();
    this.fieldOrdering = stream.readUint8();
  }
}

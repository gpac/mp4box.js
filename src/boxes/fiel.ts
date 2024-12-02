import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class fielBox extends Box {
  fieldCount: number;
  fieldOrdering: number;

  type = 'fiel' as const;

  parse(stream: MultiBufferStream) {
    this.fieldCount = stream.readUint8();
    this.fieldOrdering = stream.readUint8();
  }
}

import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class a1opBox extends Box {
  op_index: number;

  type = 'a1op' as const;

  parse(stream: MultiBufferStream) {
    this.op_index = stream.readUint8();
  }
}

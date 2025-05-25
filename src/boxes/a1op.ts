import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class a1opBox extends Box {
  type = 'a1op' as const;
  box_name = 'OperatingPointSelectorProperty';

  op_index: number;

  parse(stream: MultiBufferStream) {
    this.op_index = stream.readUint8();
  }
}

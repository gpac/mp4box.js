import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class a1opBox extends Box {
  static override fourcc = 'a1op' as const;
  box_name = 'OperatingPointSelectorProperty' as const;

  op_index: number;

  parse(stream: MultiBufferStream) {
    this.op_index = stream.readUint8();
  }
}

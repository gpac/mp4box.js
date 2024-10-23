import { Box } from '../box';
import type { MultiBufferStream } from '../buffer';

export class a1opBox extends Box {
  op_index?: number;

  constructor(size?: number) {
    super('a1op', size);
  }

  parse(stream: MultiBufferStream) {
    this.op_index = stream.readUint8();
  }
}

import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class a1opBox extends Box {
  op_index?: number;

  constructor(size?: number) {
    super('a1op', size);
  }

  parse(stream: MultiBufferStream) {
    this.op_index = stream.readUint8();
  }
}

import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class fielBox extends Box {
  fieldCount?: number;
  fieldOrdering?: number;

  constructor(size?: number) {
    super('fiel', size);
  }

  parse(stream: MultiBufferStream) {
    this.fieldCount = stream.readUint8();
    this.fieldOrdering = stream.readUint8();
  }
}

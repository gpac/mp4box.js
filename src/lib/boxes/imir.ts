import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class imirBox extends Box {
  reserved: number;
  axis: number;

  constructor(size?: number) {
    super('imir', size);
  }

  parse(stream: MultiBufferStream) {
    const tmp = stream.readUint8();
    this.reserved = tmp >> 7;
    this.axis = tmp & 1;
  }
}

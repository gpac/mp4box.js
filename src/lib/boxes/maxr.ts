import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class maxrBox extends Box {
  period: number;
  bytes: number;

  constructor(size?: number) {
    super('maxr', size);
  }

  parse(stream: MultiBufferStream) {
    this.period = stream.readUint32();
    this.bytes = stream.readUint32();
  }
}

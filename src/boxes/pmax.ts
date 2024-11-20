import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class pmaxBox extends Box {
  bytes: number;

  constructor(size?: number) {
    super('pmax', size);
  }

  parse(stream: MultiBufferStream) {
    this.bytes = stream.readUint32();
  }
}

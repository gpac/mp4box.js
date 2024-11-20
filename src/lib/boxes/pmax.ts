import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class pmaxBox extends Box {
  bytes: number;

  constructor(size?: number) {
    super('pmax', size);
  }

  parse(stream: MultiBufferStream) {
    this.bytes = stream.readUint32();
  }
}

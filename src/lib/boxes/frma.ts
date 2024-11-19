import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class frmaBox extends Box {
  data_format?: string;

  constructor(size?: number) {
    super('frma', size);
  }

  parse(stream: MultiBufferStream) {
    this.data_format = stream.readString(4);
  }
}

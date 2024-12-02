import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class frmaBox extends Box {
  data_format: string;

  type = 'frma' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.data_format = stream.readString(4);
  }
}

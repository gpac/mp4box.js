import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class frmaBox extends Box {
  data_format: string;

  type = 'frma' as const;

  parse(stream: MultiBufferStream) {
    this.data_format = stream.readString(4);
  }
}

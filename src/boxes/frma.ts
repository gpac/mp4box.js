import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class frmaBox extends Box {
  type = 'frma' as const;
  box_name = 'OriginalFormatBox';

  data_format: string;

  parse(stream: MultiBufferStream) {
    this.data_format = stream.readString(4);
  }
}

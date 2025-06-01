import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class frmaBox extends Box {
  static override readonly fourcc = 'frma' as const;
  box_name = 'OriginalFormatBox' as const;

  data_format: string;

  parse(stream: MultiBufferStream) {
    this.data_format = stream.readString(4);
  }
}

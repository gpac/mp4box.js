import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class dmedBox extends Box {
  type = 'dmed' as const;
  box_name = 'hintmediaBytesSent';

  bytessent: number;

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

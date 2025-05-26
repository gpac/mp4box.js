import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class trpyBox extends Box {
  type = 'trpy' as const;
  box_name = 'hintBytesSent';

  bytessent: number;

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

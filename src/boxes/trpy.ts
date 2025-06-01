import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class trpyBox extends Box {
  static override readonly fourcc = 'trpy' as const;
  box_name = 'hintBytesSent' as const;

  bytessent: number;

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

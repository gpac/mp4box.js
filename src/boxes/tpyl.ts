import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class tpylBox extends Box {
  static fourcc = 'tpyl' as const;
  box_name = 'hintBytesSent' as const;

  bytessent: number;

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class tpylBox extends Box {
  type = 'tpyl' as const;
  box_name = 'hintBytesSent'

  bytessent: number;

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

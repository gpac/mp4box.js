import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class dimmBox extends Box {
  type = 'dimm' as const;

  bytessent: number;

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

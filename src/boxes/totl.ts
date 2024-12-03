import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class totlBox extends Box {
  type = 'totl' as const;

  bytessent: number;

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint32();
  }
}

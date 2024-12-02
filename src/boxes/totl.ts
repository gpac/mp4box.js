import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class totlBox extends Box {
  bytessent: number;

  type = 'totl' as const;

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint32();
  }
}

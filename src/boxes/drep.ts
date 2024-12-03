import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class drepBox extends Box {
  type = 'drep' as const;

  bytessent: number;

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

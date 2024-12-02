import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class drepBox extends Box {
  bytessent: number;

  type = 'drep' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

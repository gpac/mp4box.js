import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class totlBox extends Box {
  bytessent: number;

  type = 'totl' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint32();
  }
}

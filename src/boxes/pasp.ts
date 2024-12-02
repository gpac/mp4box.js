import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class paspBox extends Box {
  hSpacing: number;
  vSpacing: number;

  type = 'pasp' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.hSpacing = stream.readUint32();
    this.vSpacing = stream.readUint32();
  }
}

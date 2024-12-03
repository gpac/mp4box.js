import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class paspBox extends Box {
  type = 'pasp' as const;

  hSpacing: number;
  vSpacing: number;

  parse(stream: MultiBufferStream) {
    this.hSpacing = stream.readUint32();
    this.vSpacing = stream.readUint32();
  }
}

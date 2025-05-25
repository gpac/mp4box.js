import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class pmaxBox extends Box {
  type = 'pmax' as const;
  box_name = 'hintlargestpacket';

  bytes: number;

  parse(stream: MultiBufferStream) {
    this.bytes = stream.readUint32();
  }
}

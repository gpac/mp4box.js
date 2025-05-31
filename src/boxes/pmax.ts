import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class pmaxBox extends Box {
  static override fourcc = 'pmax' as const;
  box_name = 'hintlargestpacket' as const;

  bytes: number;

  parse(stream: MultiBufferStream) {
    this.bytes = stream.readUint32();
  }
}

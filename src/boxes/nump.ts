import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class numpBox extends Box {
  static fourcc = 'nump' as const;
  box_name = 'hintPacketsSent' as const;

  packetssent: number;

  parse(stream: MultiBufferStream) {
    this.packetssent = stream.readUint64();
  }
}

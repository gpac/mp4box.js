import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class npckBox extends Box {
  static fourcc = 'npck' as const;
  box_name = 'hintPacketsSent' as const;

  packetssent: number;

  parse(stream: MultiBufferStream) {
    this.packetssent = stream.readUint32();
  }
}

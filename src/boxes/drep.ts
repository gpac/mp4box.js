import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class drepBox extends Box {
  static override fourcc = 'drep' as const;
  box_name = 'hintrepeatedBytesSent' as const;

  bytessent: number;

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

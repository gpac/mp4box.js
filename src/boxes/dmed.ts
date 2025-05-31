import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class dmedBox extends Box {
  static override fourcc = 'dmed' as const;
  box_name = 'hintmediaBytesSent' as const;

  bytessent: number;

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

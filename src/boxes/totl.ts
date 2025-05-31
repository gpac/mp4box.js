import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class totlBox extends Box {
  static fourcc = 'totl' as const;
  box_name = 'hintBytesSent' as const;

  bytessent: number;

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint32();
  }
}

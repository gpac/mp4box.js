import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class dimmBox extends Box {
  static fourcc = 'dimm' as const;
  box_name = 'hintimmediateBytesSent' as const;

  bytessent: number;

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint64();
  }
}

import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class tpayBox extends Box {
  bytessent: number;

  type = 'tpay' as const;

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint32();
  }
}

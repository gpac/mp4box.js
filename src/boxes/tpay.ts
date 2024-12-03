import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class tpayBox extends Box {
  type = 'tpay' as const;

  bytessent: number;

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint32();
  }
}

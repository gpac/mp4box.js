import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class tpayBox extends Box {
  bytessent: number;

  type = 'tpay' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint32();
  }
}

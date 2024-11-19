import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class tpayBox extends Box {
  bytessent?: number;

  constructor(size?: number) {
    super('tpay', size);
  }

  parse(stream: MultiBufferStream) {
    this.bytessent = stream.readUint32();
  }
}

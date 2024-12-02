import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class CoLLBox extends FullBox {
  maxCLL: number;
  maxFALL: number;

  type = 'CoLL' as const;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.maxCLL = stream.readUint16();
    this.maxFALL = stream.readUint16();
  }
}

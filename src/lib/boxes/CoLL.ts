import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class CoLLBox extends FullBox {
  maxCLL: number;
  maxFALL: number;

  constructor(size?: number) {
    super('CoLL', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.maxCLL = stream.readUint16();
    this.maxFALL = stream.readUint16();
  }
}

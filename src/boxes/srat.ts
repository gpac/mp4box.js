import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class sratBox extends FullBox {
  static override readonly fourcc = 'srat' as const;
  box_name = 'SamplingRateBox' as const;

  sampling_rate: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.sampling_rate = stream.readUint32();
  }
}

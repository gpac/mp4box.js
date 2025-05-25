import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class CoLLBox extends FullBox {
  type = 'CoLL' as const;
  box_name = 'ContentLightLevelBox';

  maxCLL: number;
  maxFALL: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.maxCLL = stream.readUint16();
    this.maxFALL = stream.readUint16();
  }
}

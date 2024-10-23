import { FullBox } from '../box';
import type { MultiBufferStream } from '../buffer';

export class pixiBox extends FullBox {
  num_channels?: number;
  bits_per_channels?: number[];

  constructor(size?: number) {
    super('pixi', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.num_channels = stream.readUint8();
    this.bits_per_channels = [];
    for (let i = 0; i < this.num_channels; i++) {
      this.bits_per_channels[i] = stream.readUint8();
    }
  }
}

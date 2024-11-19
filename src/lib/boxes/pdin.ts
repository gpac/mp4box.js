import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class pdinBox extends Box {
  rate?: number[];
  initial_delay?: number[];

  constructor(size?: number) {
    super('pdin', size);
  }

  parse(stream: MultiBufferStream) {
    var count = (this.size - this.hdr_size) / 8;
    this.rate = [];
    this.initial_delay = [];
    for (var i = 0; i < count; i++) {
      this.rate[i] = stream.readUint32();
      this.initial_delay[i] = stream.readUint32();
    }
  }
}

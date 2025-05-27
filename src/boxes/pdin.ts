import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class pdinBox extends Box {
  type = 'pdin' as const;
  box_name = 'ProgressiveDownloadInfoBox';

  rate: Array<number>;
  initial_delay: Array<number>;

  parse(stream: MultiBufferStream) {
    const count = (this.size - this.hdr_size) / 8;
    this.rate = [];
    this.initial_delay = [];
    for (let i = 0; i < count; i++) {
      this.rate[i] = stream.readUint32();
      this.initial_delay[i] = stream.readUint32();
    }
  }
}

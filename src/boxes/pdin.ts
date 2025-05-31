import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class pdinBox extends FullBox {
  static override fourcc = 'pdin' as const;
  box_name = 'ProgressiveDownloadInfoBox' as const;

  rate: Array<number> = [];
  initial_delay: Array<number> = [];

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    const count = (this.size - this.hdr_size) / 8;
    for (let i = 0; i < count; i++) {
      this.rate[i] = stream.readUint32();
      this.initial_delay[i] = stream.readUint32();
    }
  }
}

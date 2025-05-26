import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class stssBox extends FullBox {
  type = 'stss' as const;
  box_name = 'SyncSampleBox';

  sample_numbers: Array<number>;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    const entry_count = stream.readUint32();
    if (this.version === 0) {
      this.sample_numbers = [];
      for (let i = 0; i < entry_count; i++) {
        this.sample_numbers.push(stream.readUint32());
      }
    }
  }

  /** @bundle writing/stss.js */
  write = (stream: MultiBufferStream) => {
    this.version = 0;
    this.flags = 0;
    this.size = 4 + 4 * this.sample_numbers.length;
    this.writeHeader(stream);
    stream.writeUint32(this.sample_numbers.length);
    stream.writeUint32Array(this.sample_numbers);
  };
}

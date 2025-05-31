import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class stshBox extends FullBox {
  static fourcc = 'stsh' as const;
  box_name = 'ShadowSyncSampleBox' as const;

  shadowed_sample_numbers: Array<number>;
  sync_sample_numbers: Array<number>;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    const entry_count = stream.readUint32();
    this.shadowed_sample_numbers = [];
    this.sync_sample_numbers = [];
    if (this.version === 0) {
      for (let i = 0; i < entry_count; i++) {
        this.shadowed_sample_numbers.push(stream.readUint32());
        this.sync_sample_numbers.push(stream.readUint32());
      }
    }
  }

  write(stream: MultiBufferStream) {
    this.version = 0;
    this.flags = 0;
    this.size = 4 + 8 * this.shadowed_sample_numbers.length;
    this.writeHeader(stream);
    stream.writeUint32(this.shadowed_sample_numbers.length);
    for (let i = 0; i < this.shadowed_sample_numbers.length; i++) {
      stream.writeUint32(this.shadowed_sample_numbers[i]);
      stream.writeUint32(this.sync_sample_numbers[i]);
    }
  }
}

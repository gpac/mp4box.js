import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { Log } from '#/log';

export class stz2Box extends FullBox {
  static override readonly fourcc = 'stz2' as const;
  box_name = 'CompactSampleSizeBox' as const;

  sample_sizes: Array<number>;
  reserved: number;
  field_size: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.sample_sizes = [];
    if (this.version === 0) {
      this.reserved = stream.readUint24();
      this.field_size = stream.readUint8();
      const sample_count = stream.readUint32();
      if (this.field_size === 4) {
        for (let i = 0; i < sample_count; i += 2) {
          const tmp = stream.readUint8();
          this.sample_sizes[i] = (tmp >> 4) & 0xf;
          this.sample_sizes[i + 1] = tmp & 0xf;
        }
      } else if (this.field_size === 8) {
        for (let i = 0; i < sample_count; i++) {
          this.sample_sizes[i] = stream.readUint8();
        }
      } else if (this.field_size === 16) {
        for (let i = 0; i < sample_count; i++) {
          this.sample_sizes[i] = stream.readUint16();
        }
      } else {
        Log.error('BoxParser', 'Error in length field in stz2 box');
      }
    }
  }
}

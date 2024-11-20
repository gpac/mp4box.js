import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class stszBox extends FullBox {
  sample_sizes: Array<number>;
  sample_size: number;
  sample_count: number;

  constructor(size?: number) {
    super('stsz', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.sample_sizes = [];
    if (this.version === 0) {
      this.sample_size = stream.readUint32();
      this.sample_count = stream.readUint32();
      for (let i = 0; i < this.sample_count; i++) {
        if (this.sample_size === 0) {
          this.sample_sizes.push(stream.readUint32());
        } else {
          this.sample_sizes[i] = this.sample_size;
        }
      }
    }
  }

  /** @bundle writing/stsz.js */
  write(stream: MultiBufferStream) {
    let constant = true;
    this.version = 0;
    this.flags = 0;
    if (this.sample_sizes.length > 0) {
      let i = 0;
      while (i + 1 < this.sample_sizes.length) {
        if (this.sample_sizes[i + 1] !== this.sample_sizes[0]) {
          constant = false;
          break;
        } else {
          i++;
        }
      }
    } else {
      constant = false;
    }
    this.size = 8;
    if (!constant) {
      this.size += 4 * this.sample_sizes.length;
    }
    this.writeHeader(stream);
    if (!constant) {
      stream.writeUint32(0);
    } else {
      stream.writeUint32(this.sample_sizes[0]);
    }
    stream.writeUint32(this.sample_sizes.length);
    if (!constant) {
      stream.writeUint32Array(this.sample_sizes);
    }
  }

  /** @bundle box-unpack.js */
  unpack(samples) {
    for (let i = 0; i < this.sample_sizes.length; i++) {
      samples[i].size = this.sample_sizes[i];
    }
  }
}

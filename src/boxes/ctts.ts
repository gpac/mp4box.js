import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { Log } from '#/log';
import type { Sample } from '@types';

export class cttsBox extends FullBox {
  sample_counts: Array<number>;
  sample_offsets: Array<number>;

  type = 'ctts' as const;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    let entry_count = stream.readUint32();
    this.sample_counts = [];
    this.sample_offsets = [];
    if (this.version === 0) {
      for (let i = 0; i < entry_count; i++) {
        this.sample_counts.push(stream.readUint32());
        /* some files are buggy and declare version=0 while using signed offsets.
           The likelyhood of using the most significant bit in a 32-bits time offset is very low,
           so using signed value here as well */
        const value = stream.readInt32();
        if (value < 0) {
          Log.warn('BoxParser', 'ctts box uses negative values without using version 1');
        }
        this.sample_offsets.push(value);
      }
    } else if (this.version == 1) {
      for (let i = 0; i < entry_count; i++) {
        this.sample_counts.push(stream.readUint32());
        this.sample_offsets.push(stream.readInt32()); /* signed */
      }
    }
  }

  /** @bundle writing/ctts.js */
  write(stream: MultiBufferStream) {
    this.version = 0;
    this.flags = 0;
    this.size = 4 + 8 * this.sample_counts.length;
    this.writeHeader(stream);
    stream.writeUint32(this.sample_counts.length);
    for (let i = 0; i < this.sample_counts.length; i++) {
      stream.writeUint32(this.sample_counts[i]);
      if (this.version === 1) {
        stream.writeInt32(this.sample_offsets[i]); /* signed */
      } else {
        stream.writeUint32(this.sample_offsets[i]); /* unsigned */
      }
    }
  }

  /** @bundle box-unpack.js */
  unpack(samples: Array<Sample>) {
    let k = 0;
    for (let i = 0; i < this.sample_counts.length; i++) {
      for (let j = 0; j < this.sample_counts[i]; j++) {
        samples[k].pts = samples[k].dts + this.sample_offsets[i];
        k++;
      }
    }
  }
}

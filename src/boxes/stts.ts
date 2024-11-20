import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { Log } from '#/log';
import type { Sample } from '@types';

export class sttsBox extends FullBox {
  sample_counts: Array<number> = [];
  sample_deltas: Array<number> = [];

  constructor(size?: number) {
    super('stts', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    const entry_count = stream.readUint32();
    this.sample_counts.length = 0;
    this.sample_deltas.length = 0;
    if (this.version === 0) {
      for (let i = 0; i < entry_count; i++) {
        this.sample_counts.push(stream.readUint32());
        let delta = stream.readInt32();
        if (delta < 0) {
          Log.warn(
            'BoxParser',
            'File uses negative stts sample delta, using value 1 instead, sync may be lost!',
          );
          delta = 1;
        }
        this.sample_deltas.push(delta);
      }
    }
  }

  /** @bundle writing/stts.js */
  write(stream: MultiBufferStream) {
    this.version = 0;
    this.flags = 0;
    this.size = 4 + 8 * this.sample_counts.length;
    this.writeHeader(stream);
    stream.writeUint32(this.sample_counts.length);
    for (let i = 0; i < this.sample_counts.length; i++) {
      stream.writeUint32(this.sample_counts[i]);
      stream.writeUint32(this.sample_deltas[i]);
    }
  }

  /** @bundle box-unpack.js */
  unpack(samples: Array<Sample>) {
    let k = 0;
    for (let i = 0; i < this.sample_counts.length; i++) {
      for (let j = 0; j < this.sample_counts[i]; j++) {
        if (k === 0) {
          samples[k].dts = 0;
        } else {
          samples[k].dts = samples[k - 1].dts + this.sample_deltas[i];
        }
        k++;
      }
    }
  }
}

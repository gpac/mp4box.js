import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import type { Sample } from '@types';

export class stscBox extends FullBox {
  type = 'stsc' as const;
  box_name = 'SampleToChunkBox';

  first_chunk: Array<number>;
  samples_per_chunk: Array<number>;
  sample_description_index: Array<number>;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    const entry_count = stream.readUint32();
    this.first_chunk = [];
    this.samples_per_chunk = [];
    this.sample_description_index = [];
    if (this.version === 0) {
      for (let i = 0; i < entry_count; i++) {
        this.first_chunk.push(stream.readUint32());
        this.samples_per_chunk.push(stream.readUint32());
        this.sample_description_index.push(stream.readUint32());
      }
    }
  }

  write(stream: MultiBufferStream) {
    this.version = 0;
    this.flags = 0;
    this.size = 4 + 12 * this.first_chunk.length;
    this.writeHeader(stream);
    stream.writeUint32(this.first_chunk.length);
    for (let i = 0; i < this.first_chunk.length; i++) {
      stream.writeUint32(this.first_chunk[i]);
      stream.writeUint32(this.samples_per_chunk[i]);
      stream.writeUint32(this.sample_description_index[i]);
    }
  }

  unpack(samples: Array<Sample>) {
    let l = 0;
    let m = 0;
    for (let i = 0; i < this.first_chunk.length; i++) {
      for (
        let j = 0;
        j < (i + 1 < this.first_chunk.length ? this.first_chunk[i + 1] : Infinity);
        j++
      ) {
        m++;
        for (let k = 0; k < this.samples_per_chunk[i]; k++) {
          if (samples[l]) {
            samples[l].description_index = this.sample_description_index[i];
            samples[l].chunk_index = m;
          } else {
            return;
          }
          l++;
        }
      }
    }
  }
}

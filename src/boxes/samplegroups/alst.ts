import { SampleGroupEntry } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class alstSampleGroupEntry extends SampleGroupEntry {
  first_output_sample: number;
  sample_offset: Array<number>;
  num_output_samples: Array<number>;
  num_total_samples: Array<number>;

  parse(stream: MultiBufferStream) {
    const roll_count = stream.readUint16();
    this.first_output_sample = stream.readUint16();
    this.sample_offset = [];
    for (let i = 0; i < roll_count; i++) {
      this.sample_offset[i] = stream.readUint32();
    }
    const remaining = this.description_length - 4 - 4 * roll_count;
    this.num_output_samples = [];
    this.num_total_samples = [];
    for (let i = 0; i < remaining / 4; i++) {
      this.num_output_samples[i] = stream.readUint16();
      this.num_total_samples[i] = stream.readUint16();
    }
  }
}

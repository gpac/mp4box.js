import { SampleGroupEntry } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class rapSampleGroupEntry extends SampleGroupEntry {
  static grouping_type = 'rap ' as const;

  num_leading_samples_known: number;
  num_leading_samples: number;

  parse(stream: MultiBufferStream) {
    const tmp_byte = stream.readUint8();
    this.num_leading_samples_known = tmp_byte >> 7;
    this.num_leading_samples = tmp_byte & 0x7f;
  }
}

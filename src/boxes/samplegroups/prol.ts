import { SampleGroupEntry } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class prolSampleGroupEntry extends SampleGroupEntry {
  static grouping_type = 'prol' as const;

  roll_distance: number;

  parse(stream: MultiBufferStream) {
    this.roll_distance = stream.readInt16();
  }
}

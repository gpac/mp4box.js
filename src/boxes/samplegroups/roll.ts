import { SampleGroupEntry } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class rollSampleGroupEntry extends SampleGroupEntry {
  static grouping_type = 'roll' as const;

  roll_distance: number;

  parse(stream: MultiBufferStream) {
    this.roll_distance = stream.readInt16();
  }
}

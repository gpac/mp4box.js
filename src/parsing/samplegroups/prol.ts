import { SampleGroupEntry } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class prolSampleGroupEntry extends SampleGroupEntry {
  roll_distance?: number;

  parse(stream: MultiBufferStream) {
    this.roll_distance = stream.readInt16();
  }
}

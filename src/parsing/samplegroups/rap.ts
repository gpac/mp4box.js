import { SampleGroupEntry } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class rapSampleGroupEntry extends SampleGroupEntry {
  num_leading_samples_known?: number;
  num_leading_samples?: number;

  parse(stream: MultiBufferStream) {
    var tmp_byte = stream.readUint8();
    this.num_leading_samples_known = tmp_byte >> 7;
    this.num_leading_samples = tmp_byte & 0x7f;
  }
}

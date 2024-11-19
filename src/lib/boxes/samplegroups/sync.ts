import { SampleGroupEntry } from '#//box';
import { MultiBufferStream } from '#/buffer';

export class syncSampleGroupEntry extends SampleGroupEntry {
  NAL_unit_type?: number;

  parse(stream: MultiBufferStream) {
    const tmp_byte = stream.readUint8();
    this.NAL_unit_type = tmp_byte & 0x3f;
  }
}

import { SampleGroupEntry } from '#//box';
import { MultiBufferStream } from '#/buffer';

export class teleSampleGroupEntry extends SampleGroupEntry {
  level_independently_decodable: number;

  parse(stream: MultiBufferStream) {
    const tmp_byte = stream.readUint8();
    this.level_independently_decodable = tmp_byte >> 7;
  }
}

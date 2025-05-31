import { SampleGroupEntry } from '#//box';
import type { MultiBufferStream } from '#/buffer';

export class teleSampleGroupEntry extends SampleGroupEntry {
  static grouping_type = 'tele' as const;

  level_independently_decodable: number;

  parse(stream: MultiBufferStream) {
    const tmp_byte = stream.readUint8();
    this.level_independently_decodable = tmp_byte >> 7;
  }
}

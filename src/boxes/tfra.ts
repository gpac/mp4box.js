import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

class TfraEntry {
  time: number;
  moof_offset: number;
  traf_number: number;
  trun_number: number;
  sample_delta: number;
}

export class tfraBox extends FullBox {
  static override readonly fourcc = 'tfra' as const;
  box_name = 'TrackFragmentRandomAccessBox' as const;

  track_ID: number;
  length_size_of_traf_num: number;
  length_size_of_trun_num: number;
  length_size_of_sample_num: number;
  entries: Array<TfraEntry>;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.track_ID = stream.readUint32();
    stream.readUint24();
    const tmp_byte = stream.readUint8();
    this.length_size_of_traf_num = (tmp_byte >> 4) & 0x3;
    this.length_size_of_trun_num = (tmp_byte >> 2) & 0x3;
    this.length_size_of_sample_num = tmp_byte & 0x3;
    this.entries = [];
    const number_of_entries = stream.readUint32();
    for (let i = 0; i < number_of_entries; i++) {
      const entry = {} as TfraEntry;
      this.entries.push(entry);
      if (this.version === 1) {
        this.entries[i].time = stream.readUint64();
        this.entries[i].moof_offset = stream.readUint64();
      } else {
        this.entries[i].time = stream.readUint32();
        this.entries[i].moof_offset = stream.readUint32();
      }
      this.entries[i].traf_number = stream['readUint' + 8 * (this.length_size_of_traf_num + 1)]();
      this.entries[i].trun_number = stream['readUint' + 8 * (this.length_size_of_trun_num + 1)]();
      this.entries[i].sample_delta =
        stream['readUint' + 8 * (this.length_size_of_sample_num + 1)]();
    }
  }
}

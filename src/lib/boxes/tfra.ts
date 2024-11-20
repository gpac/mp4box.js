import { FullBox } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class tfraBox extends FullBox {
  track_ID?: number;
  length_size_of_traf_num?: number;
  length_size_of_trun_num?: number;
  length_size_of_sample_num?: number;
  entries?: unknown[];
  time?: number;
  moof_offset?: number;
  traf_number?: number;
  trun_number?: number;
  sample_number?: number;

  constructor(size?: number) {
    super('tfra', size);
  }

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
      if (this.version === 1) {
        this.time = stream.readUint64();
        this.moof_offset = stream.readUint64();
      } else {
        this.time = stream.readUint32();
        this.moof_offset = stream.readUint32();
      }
      this.traf_number = stream['readUint' + 8 * (this.length_size_of_traf_num + 1)]();
      this.trun_number = stream['readUint' + 8 * (this.length_size_of_trun_num + 1)]();
      this.sample_number = stream['readUint' + 8 * (this.length_size_of_sample_num + 1)]();
    }
  }
}

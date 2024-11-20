import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import {
  TRUN_FLAGS_CTS_OFFSET,
  TRUN_FLAGS_DATA_OFFSET,
  TRUN_FLAGS_DURATION,
  TRUN_FLAGS_FIRST_FLAG,
  TRUN_FLAGS_FLAGS,
  TRUN_FLAGS_SIZE,
} from '../constants';

export class trunBox extends FullBox {
  sample_count: number;
  data_offset: number;
  first_sample_flags: number;
  sample_duration: Array<number>;
  sample_size: Array<number>;
  sample_flags: Array<number>;
  sample_composition_time_offset: Array<number>;
  data_offset_position: number;

  constructor(size?: number) {
    super('trun', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    let readBytes = 0;
    this.sample_count = stream.readUint32();
    readBytes += 4;
    if (this.size - this.hdr_size > readBytes && this.flags & TRUN_FLAGS_DATA_OFFSET) {
      this.data_offset = stream.readInt32(); //signed
      readBytes += 4;
    } else {
      this.data_offset = 0;
    }
    if (this.size - this.hdr_size > readBytes && this.flags & TRUN_FLAGS_FIRST_FLAG) {
      this.first_sample_flags = stream.readUint32();
      readBytes += 4;
    } else {
      this.first_sample_flags = 0;
    }
    this.sample_duration = [];
    this.sample_size = [];
    this.sample_flags = [];
    this.sample_composition_time_offset = [];
    if (this.size - this.hdr_size > readBytes) {
      for (let i = 0; i < this.sample_count; i++) {
        if (this.flags & TRUN_FLAGS_DURATION) {
          this.sample_duration[i] = stream.readUint32();
        }
        if (this.flags & TRUN_FLAGS_SIZE) {
          this.sample_size[i] = stream.readUint32();
        }
        if (this.flags & TRUN_FLAGS_FLAGS) {
          this.sample_flags[i] = stream.readUint32();
        }
        if (this.flags & TRUN_FLAGS_CTS_OFFSET) {
          if (this.version === 0) {
            this.sample_composition_time_offset[i] = stream.readUint32();
          } else {
            this.sample_composition_time_offset[i] = stream.readInt32(); //signed
          }
        }
      }
    }
  }

  /** @bundle writing/trun.js */
  write(stream: MultiBufferStream) {
    this.version = 0;
    this.size = 4;
    if (this.flags & TRUN_FLAGS_DATA_OFFSET) {
      this.size += 4;
    }
    if (this.flags & TRUN_FLAGS_FIRST_FLAG) {
      this.size += 4;
    }
    if (this.flags & TRUN_FLAGS_DURATION) {
      this.size += 4 * this.sample_duration.length;
    }
    if (this.flags & TRUN_FLAGS_SIZE) {
      this.size += 4 * this.sample_size.length;
    }
    if (this.flags & TRUN_FLAGS_FLAGS) {
      this.size += 4 * this.sample_flags.length;
    }
    if (this.flags & TRUN_FLAGS_CTS_OFFSET) {
      this.size += 4 * this.sample_composition_time_offset.length;
    }
    this.writeHeader(stream);
    stream.writeUint32(this.sample_count);
    if (this.flags & TRUN_FLAGS_DATA_OFFSET) {
      this.data_offset_position = stream.getPosition();
      stream.writeInt32(this.data_offset); //signed
    }
    if (this.flags & TRUN_FLAGS_FIRST_FLAG) {
      stream.writeUint32(this.first_sample_flags);
    }
    for (let i = 0; i < this.sample_count; i++) {
      if (this.flags & TRUN_FLAGS_DURATION) {
        stream.writeUint32(this.sample_duration[i]);
      }
      if (this.flags & TRUN_FLAGS_SIZE) {
        stream.writeUint32(this.sample_size[i]);
      }
      if (this.flags & TRUN_FLAGS_FLAGS) {
        stream.writeUint32(this.sample_flags[i]);
      }
      if (this.flags & TRUN_FLAGS_CTS_OFFSET) {
        if (this.version === 0) {
          stream.writeUint32(this.sample_composition_time_offset[i]);
        } else {
          stream.writeInt32(this.sample_composition_time_offset[i]); //signed
        }
      }
    }
  }
}

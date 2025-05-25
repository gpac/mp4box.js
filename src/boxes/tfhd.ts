import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import {
  TFHD_FLAG_BASE_DATA_OFFSET,
  TFHD_FLAG_SAMPLE_DESC,
  TFHD_FLAG_SAMPLE_DUR,
  TFHD_FLAG_SAMPLE_FLAGS,
  TFHD_FLAG_SAMPLE_SIZE,
} from '#/constants';

export class tfhdBox extends FullBox {
  type = 'tfhd' as const;
  box_name = 'TrackFragmentHeaderBox'

  track_id: number;
  base_data_offset: number;
  default_sample_description_index: number;
  default_sample_duration: number;
  default_sample_size: number;
  default_sample_flags: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    let readBytes = 0;
    this.track_id = stream.readUint32();
    if (this.size - this.hdr_size > readBytes && this.flags & TFHD_FLAG_BASE_DATA_OFFSET) {
      this.base_data_offset = stream.readUint64();
      readBytes += 8;
    } else {
      this.base_data_offset = 0;
    }
    if (this.size - this.hdr_size > readBytes && this.flags & TFHD_FLAG_SAMPLE_DESC) {
      this.default_sample_description_index = stream.readUint32();
      readBytes += 4;
    } else {
      this.default_sample_description_index = 0;
    }
    if (this.size - this.hdr_size > readBytes && this.flags & TFHD_FLAG_SAMPLE_DUR) {
      this.default_sample_duration = stream.readUint32();
      readBytes += 4;
    } else {
      this.default_sample_duration = 0;
    }
    if (this.size - this.hdr_size > readBytes && this.flags & TFHD_FLAG_SAMPLE_SIZE) {
      this.default_sample_size = stream.readUint32();
      readBytes += 4;
    } else {
      this.default_sample_size = 0;
    }
    if (this.size - this.hdr_size > readBytes && this.flags & TFHD_FLAG_SAMPLE_FLAGS) {
      this.default_sample_flags = stream.readUint32();
      readBytes += 4;
    } else {
      this.default_sample_flags = 0;
    }
  }

  /** @bundle writing/tfhd.js */
  write(stream) {
    this.version = 0;
    this.size = 4;
    if (this.flags & TFHD_FLAG_BASE_DATA_OFFSET) {
      this.size += 8;
    }
    if (this.flags & TFHD_FLAG_SAMPLE_DESC) {
      this.size += 4;
    }
    if (this.flags & TFHD_FLAG_SAMPLE_DUR) {
      this.size += 4;
    }
    if (this.flags & TFHD_FLAG_SAMPLE_SIZE) {
      this.size += 4;
    }
    if (this.flags & TFHD_FLAG_SAMPLE_FLAGS) {
      this.size += 4;
    }
    this.writeHeader(stream);
    stream.writeUint32(this.track_id);
    if (this.flags & TFHD_FLAG_BASE_DATA_OFFSET) {
      stream.writeUint64(this.base_data_offset);
    }
    if (this.flags & TFHD_FLAG_SAMPLE_DESC) {
      stream.writeUint32(this.default_sample_description_index);
    }
    if (this.flags & TFHD_FLAG_SAMPLE_DUR) {
      stream.writeUint32(this.default_sample_duration);
    }
    if (this.flags & TFHD_FLAG_SAMPLE_SIZE) {
      stream.writeUint32(this.default_sample_size);
    }
    if (this.flags & TFHD_FLAG_SAMPLE_FLAGS) {
      stream.writeUint32(this.default_sample_flags);
    }
  }
}

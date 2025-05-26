import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class trexBox extends FullBox {
  type = 'trex' as const;
  box_name = 'TrackExtendsBox';

  track_id: number;
  default_sample_description_index: number;
  default_sample_duration: number;
  default_sample_size: number;
  default_sample_flags: number;

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.track_id = stream.readUint32();
    this.default_sample_description_index = stream.readUint32();
    this.default_sample_duration = stream.readUint32();
    this.default_sample_size = stream.readUint32();
    this.default_sample_flags = stream.readUint32();
  }

  write = (stream: MultiBufferStream) => {
    this.version = 0;
    this.flags = 0;
    this.size = 4 * 5;
    this.writeHeader(stream);
    stream.writeUint32(this.track_id);
    stream.writeUint32(this.default_sample_description_index);
    stream.writeUint32(this.default_sample_duration);
    stream.writeUint32(this.default_sample_size);
    stream.writeUint32(this.default_sample_flags);
  };
}

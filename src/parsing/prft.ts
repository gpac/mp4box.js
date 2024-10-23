import { FullBox } from '../box';
import type { MultiBufferStream } from '../buffer';

export class prftBox extends FullBox {
  ref_track_id?: number;
  ntp_timestamp?: number;
  media_time?: number;

  constructor(size?: number) {
    super('prft', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    this.ref_track_id = stream.readUint32();
    this.ntp_timestamp = stream.readUint64();
    if (this.version === 0) {
      this.media_time = stream.readUint32();
    } else {
      this.media_time = stream.readUint64();
    }
  }
}

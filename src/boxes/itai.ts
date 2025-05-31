import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class itaiBox extends FullBox {
  static fourcc = 'itai' as const;
  box_name = 'TAITimestampBox' as const;

  TAI_timestamp: number;
  sychronization_state: number;
  timestamp_generation_failure: number;
  timestamp_is_modified: number;

  parse(stream: MultiBufferStream) {
    this.TAI_timestamp = stream.readUint64();
    const status_bits = stream.readUint8();
    this.sychronization_state = (status_bits >> 7) & 0x01;
    this.timestamp_generation_failure = (status_bits >> 6) & 0x01;
    this.timestamp_is_modified = (status_bits >> 5) & 0x01;
  }
}

import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class taicBox extends FullBox {
  static fourcc = 'taic' as const;
  box_name = 'TAIClockInfoBox' as const;

  time_uncertainty: number;
  clock_resolution: number;
  clock_drift_rate: number;
  clock_type: number;

  parse(stream: MultiBufferStream) {
    this.time_uncertainty = stream.readUint64();
    this.clock_resolution = stream.readUint32();
    this.clock_drift_rate = stream.readInt32();
    const reserved_byte = stream.readUint8();
    this.clock_type = (reserved_byte & 0xc0) >> 6;
  }
}

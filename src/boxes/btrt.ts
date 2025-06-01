import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class btrtBox extends Box {
  static override readonly fourcc = 'btrt' as const;
  box_name = 'BitRateBox' as const;

  bufferSizeDB: number;
  maxBitrate: number;
  avgBitrate: number;

  parse(stream: MultiBufferStream) {
    this.bufferSizeDB = stream.readUint32();
    this.maxBitrate = stream.readUint32();
    this.avgBitrate = stream.readUint32();
  }
}

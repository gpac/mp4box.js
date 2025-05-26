import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class btrtBox extends Box {
  type = 'btrt' as const;
  box_name = 'BitRateBox';

  bufferSizeDB: number;
  maxBitrate: number;
  avgBitrate: number;

  parse(stream: MultiBufferStream) {
    this.bufferSizeDB = stream.readUint32();
    this.maxBitrate = stream.readUint32();
    this.avgBitrate = stream.readUint32();
  }
}

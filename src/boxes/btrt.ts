import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class btrtBox extends Box {
  bufferSizeDB: number;
  maxBitrate: number;
  avgBitrate: number;

  type = 'btrt' as const;
  constructor(size?: number) {
    super(size);
  }

  parse(stream: MultiBufferStream) {
    this.bufferSizeDB = stream.readUint32();
    this.maxBitrate = stream.readUint32();
    this.avgBitrate = stream.readUint32();
  }
}

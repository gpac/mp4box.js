import { Box } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class btrtBox extends Box {
  bufferSizeDB: number;
  maxBitrate: number;
  avgBitrate: number;

  constructor(size?: number) {
    super('btrt', size);
  }

  parse(stream: MultiBufferStream) {
    this.bufferSizeDB = stream.readUint32();
    this.maxBitrate = stream.readUint32();
    this.avgBitrate = stream.readUint32();
  }
}

import { SampleGroupEntry } from '#/box';
import { MultiBufferStream } from '#/buffer';

export class avllSampleGroupEntry extends SampleGroupEntry {
  layerNumber?: number;
  accurateStatisticsFlag?: number;
  avgBitRate?: number;
  avgFrameRate?: number;

  parse(stream: MultiBufferStream) {
    this.layerNumber = stream.readUint8();
    this.accurateStatisticsFlag = stream.readUint8();
    this.avgBitRate = stream.readUint16();
    this.avgFrameRate = stream.readUint16();
  }
}

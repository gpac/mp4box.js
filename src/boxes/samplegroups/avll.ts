import { SampleGroupEntry } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class avllSampleGroupEntry extends SampleGroupEntry {
  static grouping_type = 'avll' as const;

  layerNumber: number;
  accurateStatisticsFlag: number;
  avgBitRate: number;
  avgFrameRate: number;

  parse(stream: MultiBufferStream) {
    this.layerNumber = stream.readUint8();
    this.accurateStatisticsFlag = stream.readUint8();
    this.avgBitRate = stream.readUint16();
    this.avgFrameRate = stream.readUint16();
  }
}

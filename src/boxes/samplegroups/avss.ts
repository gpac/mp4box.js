import { SampleGroupEntry } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class avssSampleGroupEntry extends SampleGroupEntry {
  subSequenceIdentifier: number;
  layerNumber: number;
  durationFlag: number;
  avgRateFlag: number;
  duration: number;
  accurateStatisticsFlag: number;
  avgBitRate: number;
  avgFrameRate: number;
  dependency: {
    subSeqDirectionFlag: number;
    layerNumber: number;
    subSequenceIdentifier: number;
  }[];

  parse(stream: MultiBufferStream) {
    this.subSequenceIdentifier = stream.readUint16();
    this.layerNumber = stream.readUint8();
    const tmp_byte = stream.readUint8();
    this.durationFlag = tmp_byte >> 7;
    this.avgRateFlag = (tmp_byte >> 6) & 0x1;
    if (this.durationFlag) {
      this.duration = stream.readUint32();
    }
    if (this.avgRateFlag) {
      this.accurateStatisticsFlag = stream.readUint8();
      this.avgBitRate = stream.readUint16();
      this.avgFrameRate = stream.readUint16();
    }
    this.dependency = [];
    const numReferences = stream.readUint8();
    for (let i = 0; i < numReferences; i++) {
      this.dependency.push({
        subSeqDirectionFlag: stream.readUint8(),
        layerNumber: stream.readUint8(),
        subSequenceIdentifier: stream.readUint16(),
      });
    }
  }
}

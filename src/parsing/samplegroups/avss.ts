import { SampleGroupEntry } from '../../box';
import { MultiBufferStream } from '../../buffer';

interface Dependency {
  subSeqDirectionFlag: number;
  layerNumber: number;
  subSequenceIdentifier: number;
}

export class avssSampleGroupEntry extends SampleGroupEntry {
  subSequenceIdentifier?: number;
  layerNumber?: number;
  durationFlag?: number;
  avgRateFlag?: number;
  duration?: number;
  accurateStatisticsFlag?: number;
  avgBitRate?: number;
  avgFrameRate?: number;
  dependency?: Dependency[];

  parse(stream: MultiBufferStream) {
    this.subSequenceIdentifier = stream.readUint16();
    this.layerNumber = stream.readUint8();
    var tmp_byte = stream.readUint8();
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
    var numReferences = stream.readUint8();
    for (var i = 0; i < numReferences; i++) {
      var dependencyInfo = {} as Dependency;
      this.dependency.push(dependencyInfo);
      dependencyInfo.subSeqDirectionFlag = stream.readUint8();
      dependencyInfo.layerNumber = stream.readUint8();
      dependencyInfo.subSequenceIdentifier = stream.readUint16();
    }
  }
}

import { FullBox } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class vpcCBox extends FullBox {
  profile: number;
  level: number;
  bitDepth: number;
  chromaSubsampling: number;
  videoFullRangeFlag: number;
  colourPrimaries: number;
  transferCharacteristics: number;
  matrixCoefficients: number;
  codecIntializationDataSize: number;
  codecIntializationData: Uint8Array;
  colorSpace: number;
  transferFunction: number;

  constructor(size?: number) {
    super('vpcC', size);
  }

  parse(stream: MultiBufferStream) {
    this.parseFullHeader(stream);
    if (this.version === 1) {
      this.profile = stream.readUint8();
      this.level = stream.readUint8();
      const tmp = stream.readUint8();
      this.bitDepth = tmp >> 4;
      this.chromaSubsampling = (tmp >> 1) & 0x7;
      this.videoFullRangeFlag = tmp & 0x1;
      this.colourPrimaries = stream.readUint8();
      this.transferCharacteristics = stream.readUint8();
      this.matrixCoefficients = stream.readUint8();
      this.codecIntializationDataSize = stream.readUint16();
      this.codecIntializationData = stream.readUint8Array(this.codecIntializationDataSize);
    } else {
      this.profile = stream.readUint8();
      this.level = stream.readUint8();
      let tmp = stream.readUint8();
      this.bitDepth = (tmp >> 4) & 0xf;
      this.colorSpace = tmp & 0xf;
      tmp = stream.readUint8();
      this.chromaSubsampling = (tmp >> 4) & 0xf;
      this.transferFunction = (tmp >> 1) & 0x7;
      this.videoFullRangeFlag = tmp & 0x1;
      this.codecIntializationDataSize = stream.readUint16();
      this.codecIntializationData = stream.readUint8Array(this.codecIntializationDataSize);
    }
  }
}

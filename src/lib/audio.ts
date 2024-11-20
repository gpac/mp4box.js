import { MP4BoxStream } from '#/stream';

export class AudioSpecificConfig {
  samplingFrequencyIndex?: number;
  samplingFrequency?: number;
  channelConfiguration?: number;
  sbrPresentFlag?: number;
  psPresentFlag?: number;
  extensionAudioObjectType?: number;
  extensionSamplingFrequencyIndex?: number;

  static getAudioObjectType(stream: MP4BoxStream) {
    let tmp = stream.readUint8();
    let audioObjectType = tmp >> 3;
    if (audioObjectType === 0x1f) {
      audioObjectType = 32;
      audioObjectType += tmp & 0x7;
      tmp = stream.readUint8();
      audioObjectType += tmp >> 2;
    }
    return audioObjectType;
  }

  parse(stream: MP4BoxStream, audioObjectType: unknown) {
    let tmp = stream.readUint8();
    this.samplingFrequencyIndex = tmp >> 4;
    if (this.samplingFrequencyIndex === 0xf) {
      this.samplingFrequency = (tmp & 0xf) << 20;
      this.samplingFrequency += stream.readUint8() << 12;
      this.samplingFrequency += stream.readUint8() << 4;
      tmp = stream.readUint8();
      this.samplingFrequency += tmp >> 4;
    }
    this.channelConfiguration = tmp & 0xf;
    this.sbrPresentFlag = -1;
    this.psPresentFlag = -1;
    if (audioObjectType === 5 || audioObjectType === 29) {
      this.extensionAudioObjectType = 5;
      this.sbrPresentFlag = 1;
      if (audioObjectType === 29) {
        this.psPresentFlag = 1;
      }
      tmp = stream.readUint8();
      this.extensionSamplingFrequencyIndex = tmp >> 4;
      if (this.extensionSamplingFrequencyIndex === 0xf) {
        this.extensionSamplingFrequencyIndex = (tmp & 0xf) << 20;
        this.extensionSamplingFrequencyIndex += stream.readUint8() << 12;
        this.extensionSamplingFrequencyIndex += stream.readUint8() << 4;
        tmp = stream.readUint8();
        this.extensionSamplingFrequencyIndex += tmp >> 4;
      }
    }
  }
}

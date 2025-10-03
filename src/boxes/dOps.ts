import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

export class dOpsBox extends Box {
  static override readonly fourcc = 'dOps' as const;
  box_name = 'OpusSpecificBox' as const;

  Version: number;
  OutputChannelCount: number;
  PreSkip: number;
  InputSampleRate: number;
  OutputGain: number;
  ChannelMappingFamily: number;
  StreamCount: number;
  CoupledCount: number;
  ChannelMapping: Array<number>;

  parse(stream: MultiBufferStream) {
    this.Version = stream.readUint8();
    this.OutputChannelCount = stream.readUint8();
    this.PreSkip = stream.readUint16();
    this.InputSampleRate = stream.readUint32();
    this.OutputGain = stream.readInt16();
    this.ChannelMappingFamily = stream.readUint8();
    if (this.ChannelMappingFamily !== 0) {
      this.StreamCount = stream.readUint8();
      this.CoupledCount = stream.readUint8();
      this.ChannelMapping = [];
      for (let i = 0; i < this.OutputChannelCount; i++) {
        this.ChannelMapping[i] = stream.readUint8();
      }
    }
  }

  write(stream: MultiBufferStream) {
    this.size = 11; // Version(1) + OutputChannelCount(1) + PreSkip(2) + InputSampleRate(4) + OutputGain(2) + ChannelMappingFamily(1)
    if (this.ChannelMappingFamily !== 0) {
      // Add StreamCount(1) + CoupledCount(1) + ChannelMapping array
      this.size += 2 + this.OutputChannelCount;
    }

    this.writeHeader(stream);
    stream.writeUint8(this.Version);
    stream.writeUint8(this.OutputChannelCount);
    stream.writeUint16(this.PreSkip);
    stream.writeUint32(this.InputSampleRate);
    stream.writeInt16(this.OutputGain);
    stream.writeUint8(this.ChannelMappingFamily);
    if (this.ChannelMappingFamily !== 0) {
      stream.writeUint8(this.StreamCount);
      stream.writeUint8(this.CoupledCount);
      for (let i = 0; i < this.OutputChannelCount; i++) {
        stream.writeUint8(this.ChannelMapping[i]);
      }
    }
  }
}

import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';
import { DataStream } from '#/DataStream';
import { MP4BoxStream } from '#/stream';
import type { ParameterSetArray } from './displays/pixel';

export class avcCBox extends Box {
  type = 'avcC' as const;
  box_name = 'AVCConfigurationBox';

  configurationVersion: number;
  AVCProfileIndication: number;
  profile_compatibility: number;
  AVCLevelIndication: number;
  lengthSizeMinusOne: number;
  nb_SPS_nalus: number;
  SPS: ParameterSetArray;
  nb_PPS_nalus: number;
  PPS: ParameterSetArray;
  ext: Uint8Array;

  parse(stream: DataStream | MP4BoxStream) {
    this.configurationVersion = stream.readUint8();
    this.AVCProfileIndication = stream.readUint8();
    this.profile_compatibility = stream.readUint8();
    this.AVCLevelIndication = stream.readUint8();
    this.lengthSizeMinusOne = stream.readUint8() & 0x3;
    this.nb_SPS_nalus = stream.readUint8() & 0x1f;
    let toparse = this.size - this.hdr_size - 6;
    this.SPS = [];
    for (let i = 0; i < this.nb_SPS_nalus; i++) {
      const length = stream.readUint16();
      this.SPS[i] = {
        length,
        data: stream.readUint8Array(length),
      };
      toparse -= 2 + length;
    }
    this.nb_PPS_nalus = stream.readUint8();
    toparse--;
    this.PPS = [];
    for (let i = 0; i < this.nb_PPS_nalus; i++) {
      const length = stream.readUint16();
      this.PPS[i] = {
        length,
        data: stream.readUint8Array(length),
      };
      toparse -= 2 + length;
    }
    if (toparse > 0) {
      this.ext = stream.readUint8Array(toparse);
    }
  }

  /** @bundle writing/avcC.js */
  write(stream: MultiBufferStream) {
    this.size = 7;
    for (let i = 0; i < this.SPS.length; i++) {
      this.size += 2 + this.SPS[i].length;
    }
    for (let i = 0; i < this.PPS.length; i++) {
      this.size += 2 + this.PPS[i].length;
    }
    if (this.ext) {
      this.size += this.ext.length;
    }
    this.writeHeader(stream);
    stream.writeUint8(this.configurationVersion);
    stream.writeUint8(this.AVCProfileIndication);
    stream.writeUint8(this.profile_compatibility);
    stream.writeUint8(this.AVCLevelIndication);
    stream.writeUint8(this.lengthSizeMinusOne + (63 << 2));
    stream.writeUint8(this.SPS.length + (7 << 5));
    for (let i = 0; i < this.SPS.length; i++) {
      stream.writeUint16(this.SPS[i].length);
      stream.writeUint8Array(this.SPS[i].data);
    }
    stream.writeUint8(this.PPS.length);
    for (let i = 0; i < this.PPS.length; i++) {
      stream.writeUint16(this.PPS[i].length);
      stream.writeUint8Array(this.PPS[i].data);
    }
    if (this.ext) {
      stream.writeUint8Array(this.ext);
    }
  }
}

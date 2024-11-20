import { Box } from '#/box';
import { DataStream } from '#/DataStream';
import { MP4BoxStream } from '#/stream';
import type { NaluArray } from '#/types';

export class hvcCBox extends Box {
  configurationVersion: number;
  general_profile_space: number;
  general_tier_flag: number;
  general_profile_idc: number;
  general_profile_compatibility: number;
  general_constraint_indicator: Uint8Array;
  general_level_idc: number;
  min_spatial_segmentation_idc: number;
  parallelismType: number;
  chroma_format_idc: number;
  bit_depth_luma_minus8: number;
  bit_depth_chroma_minus8: number;
  avgFrameRate: number;
  constantFrameRate: number;
  numTemporalLayers: number;
  temporalIdNested: number;
  lengthSizeMinusOne: number;
  nalu_arrays: Array<NaluArray>;

  constructor(size?: number) {
    super('hvcC', size);
  }

  parse(stream: DataStream | MP4BoxStream) {
    this.configurationVersion = stream.readUint8();
    let tmp_byte = stream.readUint8();
    this.general_profile_space = tmp_byte >> 6;
    this.general_tier_flag = (tmp_byte & 0x20) >> 5;
    this.general_profile_idc = tmp_byte & 0x1f;
    this.general_profile_compatibility = stream.readUint32();
    this.general_constraint_indicator = stream.readUint8Array(6);
    this.general_level_idc = stream.readUint8();
    this.min_spatial_segmentation_idc = stream.readUint16() & 0xfff;
    this.parallelismType = stream.readUint8() & 0x3;
    this.chroma_format_idc = stream.readUint8() & 0x3;
    this.bit_depth_luma_minus8 = stream.readUint8() & 0x7;
    this.bit_depth_chroma_minus8 = stream.readUint8() & 0x7;
    this.avgFrameRate = stream.readUint16();
    tmp_byte = stream.readUint8();
    this.constantFrameRate = tmp_byte >> 6;
    this.numTemporalLayers = (tmp_byte & 0xd) >> 3;
    this.temporalIdNested = (tmp_byte & 0x4) >> 2;
    this.lengthSizeMinusOne = tmp_byte & 0x3;

    this.nalu_arrays = [];
    const numOfArrays = stream.readUint8();
    for (let i = 0; i < numOfArrays; i++) {
      const nalu_array = [] as NaluArray;
      this.nalu_arrays.push(nalu_array);
      tmp_byte = stream.readUint8();
      nalu_array.completeness = (tmp_byte & 0x80) >> 7;
      nalu_array.nalu_type = tmp_byte & 0x3f;
      const numNalus = stream.readUint16();
      for (let j = 0; j < numNalus; j++) {
        const length = stream.readUint16();
        nalu_array.push({
          data: stream.readUint8Array(length),
        });
      }
    }
  }

  /** @bundle writing/write.js */
  write(stream: DataStream) {
    this.size = 23;

    for (let i = 0; i < this.nalu_arrays.length; i++) {
      this.size += 3;
      for (let j = 0; j < this.nalu_arrays[i].length; j++) {
        this.size += 2 + this.nalu_arrays[i][j].data.length;
      }
    }

    this.writeHeader(stream);

    stream.writeUint8(this.configurationVersion);
    stream.writeUint8(
      (this.general_profile_space << 6) + (this.general_tier_flag << 5) + this.general_profile_idc,
    );
    stream.writeUint32(this.general_profile_compatibility);
    stream.writeUint8Array(this.general_constraint_indicator);
    stream.writeUint8(this.general_level_idc);
    stream.writeUint16(this.min_spatial_segmentation_idc + (15 << 24));
    stream.writeUint8(this.parallelismType + (63 << 2));
    stream.writeUint8(this.chroma_format_idc + (63 << 2));
    stream.writeUint8(this.bit_depth_luma_minus8 + (31 << 3));
    stream.writeUint8(this.bit_depth_chroma_minus8 + (31 << 3));
    stream.writeUint16(this.avgFrameRate);
    stream.writeUint8(
      (this.constantFrameRate << 6) +
        (this.numTemporalLayers << 3) +
        (this.temporalIdNested << 2) +
        this.lengthSizeMinusOne,
    );
    stream.writeUint8(this.nalu_arrays.length);
    for (let i = 0; i < this.nalu_arrays.length; i++) {
      // bit(1) array_completeness + bit(1) reserved = 0 + bit(6) nal_unit_type
      stream.writeUint8((this.nalu_arrays[i].completeness << 7) + this.nalu_arrays[i].nalu_type);
      stream.writeUint16(this.nalu_arrays[i].length);
      for (let j = 0; j < this.nalu_arrays[i].length; j++) {
        stream.writeUint16(this.nalu_arrays[i][j].data.length);
        stream.writeUint8Array(this.nalu_arrays[i][j].data);
      }
    }
  }
}

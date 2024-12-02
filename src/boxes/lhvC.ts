import { Box } from '#/box';
import type { MultiBufferStream } from '#/buffer';

type NaluArray = Array<{
  data: Uint8Array;
}> & {
  completeness: number;
  nalu_type: number;
};

export class lhvCBox extends Box {
  configurationVersion: number;
  min_spatial_segmentation_idc: number;
  parallelismType: number;
  numTemporalLayers: number;
  temporalIdNested: number;
  lengthSizeMinusOne: number;
  nalu_arrays: Array<NaluArray>;

  type = 'lhvC' as const;

  parse(stream: MultiBufferStream) {
    this.configurationVersion = stream.readUint8();
    this.min_spatial_segmentation_idc = stream.readUint16() & 0xfff;
    this.parallelismType = stream.readUint8() & 0x3;
    let tmp_byte = stream.readUint8();
    this.numTemporalLayers = (tmp_byte & 0xd) >> 3;
    this.temporalIdNested = (tmp_byte & 0x4) >> 2;
    this.lengthSizeMinusOne = tmp_byte & 0x3;

    this.nalu_arrays = [];
    const numOfArrays = stream.readUint8();

    for (let i = 0; i < numOfArrays; i++) {
      let nalu_array = [] as NaluArray;
      this.nalu_arrays.push(nalu_array);
      tmp_byte = stream.readUint8();
      nalu_array.completeness = (tmp_byte & 0x80) >> 7;
      nalu_array.nalu_type = tmp_byte & 0x3f;
      const numNalus = stream.readUint16();
      for (let j = 0; j < numNalus; j++) {
        const length = stream.readUint16();
        nalu_array.push({ data: stream.readUint8Array(length) });
      }
    }
  }
}

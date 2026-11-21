import { createFile, DataStream, Endianness, MP4BoxBuffer } from '../entries/all';
import type { hvcCBox } from '../src/boxes/hvcC';
import type { lhvCBox } from '../src/boxes/lhvC';

function hex(value: string) {
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(value.slice(2 * i, 2 * i + 2), 16);
  return bytes;
}

function parse<T>(bytes: Uint8Array, type: string) {
  const mp4 = createFile();
  mp4.appendBuffer(MP4BoxBuffer.fromArrayBuffer(bytes.slice().buffer, 0));
  mp4.flush();
  return mp4.boxes.find(b => b.type === type) as T;
}

// HEVCDecoderConfigurationRecord with no NAL unit arrays; the last but one byte is
// bit(2) constantFrameRate, bit(3) numTemporalLayers, bit(1) temporalIdNested,
// unsigned int(2) lengthSizeMinusOne
function hvcC(layersByte: string) {
  return hex(
    [
      '0000001f68766343', // size 31, 'hvcC'
      '0101600000009000000000005d', // version, profile, compatibility, constraints, level
      'f000fcfdf8f80000', // min_spatial_segmentation_idc, parallelism, chroma, bit depths, frame rate
      layersByte,
      '00', // numOfArrays
    ].join(''),
  );
}

describe('numTemporalLayers', () => {
  it.for([
    ['13', 0, 2, 0, 3],
    ['23', 0, 4, 0, 3],
    ['3f', 0, 7, 1, 3],
    ['b4', 2, 6, 1, 0],
  ] as const)(
    'reads hvcC byte 0x%s',
    ([byte, constantFrameRate, numTemporalLayers, temporalIdNested, lengthSizeMinusOne]) => {
      const box = parse<hvcCBox>(hvcC(byte), 'hvcC');
      expect(box.constantFrameRate).toBe(constantFrameRate);
      expect(box.numTemporalLayers).toBe(numTemporalLayers);
      expect(box.temporalIdNested).toBe(temporalIdNested);
      expect(box.lengthSizeMinusOne).toBe(lengthSizeMinusOne);
    },
  );

  it('writes hvcC numTemporalLayers back unchanged', () => {
    const bytes = hvcC('23');
    const box = parse<hvcCBox>(bytes, 'hvcC');
    const stream = new DataStream(undefined, 0, Endianness.BIG_ENDIAN);
    box.write(stream);
    const written = new Uint8Array(stream.buffer, 0, stream.getPosition());
    expect(written[bytes.length - 2]).toBe(0x23);
  });

  it('reads lhvC numTemporalLayers', () => {
    const bytes = hex(
      [
        '0000000e6c687643', // size 14, 'lhvC'
        '01f000fc', // version, min_spatial_segmentation_idc, parallelismType
        'f3', // reserved '11', numTemporalLayers 6, temporalIdNested 0, lengthSizeMinusOne 3
        '00', // numOfArrays
      ].join(''),
    );
    const box = parse<lhvCBox>(bytes, 'lhvC');
    expect(box.numTemporalLayers).toBe(6);
    expect(box.temporalIdNested).toBe(0);
    expect(box.lengthSizeMinusOne).toBe(3);
  });
});

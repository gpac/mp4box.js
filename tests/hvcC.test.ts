import { createFile, DataStream, Endianness, MP4BoxBuffer, type hvcCBox } from '../entries/all';

function hex(value: string) {
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(value.slice(2 * i, 2 * i + 2), 16);
  return bytes;
}

function roundTrip(bytes: Uint8Array) {
  const mp4 = createFile();
  mp4.appendBuffer(MP4BoxBuffer.fromArrayBuffer(bytes.slice().buffer, 0));
  mp4.flush();
  const hvcC = mp4.boxes.find(b => b.type === 'hvcC') as hvcCBox;
  const stream = new DataStream(undefined, 0, Endianness.BIG_ENDIAN);
  hvcC.write(stream);
  return { hvcC, written: new Uint8Array(stream.buffer, 0, stream.getPosition()) };
}

describe('hvcC box', () => {
  it('writes back the reserved bits in front of min_spatial_segmentation_idc', () => {
    // HEVCDecoderConfigurationRecord with no NAL unit arrays
    const bytes = hex(
      [
        '0000001f68766343', // size 31, 'hvcC'
        '0101600000009000000000005d', // version, profile, compatibility, constraints, level
        'f00a', // bit(4) reserved = 1111, min_spatial_segmentation_idc = 10
        'fcfdf8f800000f00', // parallelism, chroma, bit depths, frame rate, lengthSize, 0 arrays
      ].join(''),
    );
    const { hvcC, written } = roundTrip(bytes);

    expect(hvcC.min_spatial_segmentation_idc).toBe(0x00a);
    expect(Array.from(written.subarray(21, 23))).toEqual([0xf0, 0x0a]);
    expect(Array.from(written)).toEqual(Array.from(bytes));
  });
});

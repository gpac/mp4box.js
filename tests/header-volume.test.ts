import { createFile, DataStream, Endianness, MP4BoxBuffer } from '../entries/all';
import type { mvhdBox } from '../src/boxes/mvhd';
import type { tkhdBox } from '../src/boxes/tkhd';

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

function write(box: { write(stream: DataStream): void }) {
  const stream = new DataStream(undefined, 0, Endianness.BIG_ENDIAN);
  box.write(stream);
  return new Uint8Array(stream.buffer, 0, stream.getPosition());
}

const MATRIX = '000100000000000000000000000000000001000000000000000000000000000040000000';

// version 0 MovieHeaderBox, volume is 8.8 fixed point at byte 32
function mvhd(volume: string) {
  return hex(
    [
      '0000006c6d766864', // size 108, 'mvhd'
      '00000000', // version, flags
      '00000000000000000000025800000000', // creation, modification, timescale 600, duration
      '00010000', // rate 1.0
      volume,
      '0000',
      '0000000000000000',
      MATRIX,
      '000000000000000000000000000000000000000000000000',
      '00000002', // next_track_id
    ].join(''),
  );
}

// version 0 TrackHeaderBox, volume is 8.8 fixed point at byte 44
function tkhd(volume: string) {
  return hex(
    [
      '0000005c746b6864', // size 92, 'tkhd'
      '00000003', // version, flags
      '0000000000000000000000010000000000000000', // creation, modification, track_id 1, reserved, duration
      '0000000000000000',
      '00000000', // layer, alternate_group
      volume,
      '0000',
      MATRIX,
      '0000000000000000', // width, height
    ].join(''),
  );
}

function printed(box: { print(output: { log(s: string): void; indent: string }): void }) {
  const lines: Array<string> = [];
  box.print({ log: line => lines.push(line), indent: '' });
  return lines.find(line => line.startsWith('volume: '));
}

describe('mvhd and tkhd volume', () => {
  it.for([
    ['0100', 1],
    ['0080', 0.5],
    ['0000', 0],
  ] as const)('reads mvhd volume 0x%s', ([volume, expected]) => {
    const box = parse<mvhdBox>(mvhd(volume), 'mvhd');
    expect(box.volume).toBe(expected);
    expect(printed(box)).toBe('volume: ' + expected);
  });

  it.for([
    ['0100', 1],
    ['0080', 0.5],
    ['ff00', -1],
  ] as const)('reads tkhd volume 0x%s', ([volume, expected]) => {
    const box = parse<tkhdBox>(tkhd(volume), 'tkhd');
    expect(box.volume).toBe(expected);
    expect(printed(box)).toBe('volume: ' + expected);
  });

  it('writes mvhd and tkhd back unchanged', () => {
    for (const bytes of [mvhd('0100'), mvhd('0080')]) {
      expect(write(parse<mvhdBox>(bytes, 'mvhd'))).toEqual(bytes);
    }
    for (const bytes of [tkhd('0100'), tkhd('0080')]) {
      expect(write(parse<tkhdBox>(bytes, 'tkhd'))).toEqual(bytes);
    }
  });

  it('writes full volume in the mvhd of a new audio file', () => {
    const mp4 = createFile();
    mp4.init({ timescale: 48000 });
    const bytes = write(mp4.moov.mvhd);
    expect(bytes[32]).toBe(0x01);
    expect(bytes[33]).toBe(0x00);
  });
});

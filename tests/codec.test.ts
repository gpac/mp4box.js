import { createFile, MP4BoxBuffer } from '../entries/all';
import {
  mp4aSampleEntry,
  mp4vSampleEntry,
  vp09SampleEntry,
  vvc1SampleEntry,
} from '../src/boxes/sampleentries/sampleentry';
import type { esdsBox } from '../src/boxes/esds';
import type { waveBox } from '../src/boxes/qt/wave';
import type { vpcCBox } from '../src/boxes/vpcC';
import type { vvcCBox } from '../src/boxes/vvcC';
import { DataStream } from '../src/DataStream';
import { type ES_Descriptor, MPEG4DescriptorParser } from '../src/descriptor';

describe('Codec strings', () => {
  const makeEsds = () =>
    ({
      esd: {
        getOTI: () => 0x40,
        getAudioConfig: () => 2,
      },
    }) as esdsBox;

  it('should include AAC object type from nested QuickTime wave esds', () => {
    const entry = new mp4aSampleEntry();
    entry.wave = { esds: makeEsds() } as waveBox;

    expect(entry.getCodec()).toBe('mp4a.40.2');
  });

  it('should keep bare mp4a when no esds is present', () => {
    const entry = new mp4aSampleEntry();

    expect(entry.getCodec()).toBe('mp4a');
  });

  const makeVpcC = (fields: Partial<vpcCBox>) =>
    ({
      version: 1,
      profile: 0,
      level: 41,
      bitDepth: 8,
      chromaSubsampling: 1,
      colourPrimaries: 1,
      transferCharacteristics: 1,
      matrixCoefficients: 1,
      videoFullRangeFlag: 0,
      ...fields,
    }) as vpcCBox;

  it('should leave out the optional VP fields when they have the default values', () => {
    const entry = new vp09SampleEntry();
    entry.vpcC = makeVpcC({});

    expect(entry.getCodec()).toBe('vp09.00.41.08');
  });

  it('should include the optional VP fields when they are not the default values', () => {
    const entry = new vp09SampleEntry();
    entry.vpcC = makeVpcC({
      profile: 2,
      level: 10,
      bitDepth: 10,
      colourPrimaries: 9,
      transferCharacteristics: 16,
      matrixCoefficients: 9,
      videoFullRangeFlag: 1,
    });

    expect(entry.getCodec()).toBe('vp09.02.10.10.01.09.16.09.01');
  });

  const makeVisualEsds = (oti: number) =>
    ({
      esd: {
        getOTI: () => oti,
      },
    }) as esdsBox;

  it('should include the OTI and profile level of MPEG-4 Visual in mp4v', () => {
    // The ES_Descriptor that ffmpeg writes for MPEG-4 Visual: OTI 0x20, and decoder specific info
    // starting with a visual object sequence header with profile_and_level_indication 1
    const hex =
      '038080804f000100048080804120110000000007587800075878058080802f000001b001000001b58913000001' +
      '000000012000c48d8800cd05040b5443000001b24c61766336302e33312e313032068080800102';
    const bytes = Uint8Array.from(hex.match(/../g).map(byte => parseInt(byte, 16)));
    const entry = new mp4vSampleEntry();
    entry.esds = {
      esd: new MPEG4DescriptorParser().parseOneDescriptor(
        new DataStream(bytes.buffer, 0),
      ) as ES_Descriptor,
    } as esdsBox;

    expect(entry.getCodec()).toBe('mp4v.20.1');
  });

  it('should include the OTI of MPEG-2 video in mp4v', () => {
    const entry = new mp4vSampleEntry();
    entry.esds = makeVisualEsds(0x61);

    expect(entry.getCodec()).toBe('mp4v.61');
  });

  it('should write the OTI of mp4a in uppercase hexadecimal', () => {
    // MP3 (0x6B): Chromium recognizes mp4a.6B but not mp4a.6b
    const mp3 = new mp4aSampleEntry();
    mp3.esds = { esd: { getOTI: () => 0x6b, getAudioConfig: () => undefined } } as esdsBox;
    expect(mp3.getCodec()).toBe('mp4a.6B');

    const ac3 = new mp4aSampleEntry();
    ac3.esds = { esd: { getOTI: () => 0xa5, getAudioConfig: () => undefined } } as esdsBox;
    expect(ac3.getCodec()).toBe('mp4a.A5');
  });

  it('should write the OTI of mp4v in uppercase hexadecimal', () => {
    // MPEG-1 video (0x6A)
    const entry = new mp4vSampleEntry();
    entry.esds = makeVisualEsds(0x6a);

    expect(entry.getCodec()).toBe('mp4v.6A');
  });

  // vvcC with a PTL record for Main 10, Main tier, level 5.1 (83), followed by the given
  // num_bytes_constraint_info bytes (ptl_frame_only_constraint_flag, ptl_multilayer_enabled_flag
  // and general_constraint_info)
  const parseVvcC = (constraintHex: string) => {
    const n = constraintHex.length / 2;
    const payload =
      '00000000' + // version, flags
      'ff' + // reserved, lengthSizeMinusOne 3, ptl_present_flag 1
      '0015' + // ols_idx 0, num_sublayers 1, constant_frame_rate 1, chroma_format_idc 1
      '5f' + // bit_depth_minus8 2, reserved
      ((n << 8) | (1 << 1)).toString(16).padStart(4, '0') + // num_bytes_constraint_info, profile 1, tier 0
      '53' + // general_level_idc 83
      constraintHex +
      '00' + // ptl_num_sub_profiles
      '0780' + // max_picture_width
      '0438' + // max_picture_height
      '0000' + // avg_frame_rate
      '00'; // num_of_arrays
    const box = ((payload.length / 2 + 8).toString(16).padStart(8, '0') + '76766343' + payload)
      .match(/../g)
      .map(byte => parseInt(byte, 16));
    const mp4 = createFile();
    mp4.appendBuffer(MP4BoxBuffer.fromArrayBuffer(Uint8Array.from(box).buffer, 0));
    mp4.flush();
    return mp4.boxes.find(b => b.type === 'vvcC') as vvcCBox;
  };

  it('should encode the constraint bits of vvcC in the order they are stored', () => {
    const entry = new vvc1SampleEntry();
    entry.vvcC = parseVvcC('a5c380');

    // 10100101 11000011 10000000 in base32
    expect(entry.getCodec()).toBe('vvc1.1.L83.CUXBYA');
  });

  it('should keep the last six constraint bits of vvcC', () => {
    const entry = new vvc1SampleEntry();
    entry.vvcC = parseVvcC('000005');

    // 00000000 00000000 00000101 in base32
    expect(entry.getCodec()).toBe('vvc1.1.L83.CAAAAK');
  });

  it('should write CA when all constraint bits of vvcC are zero', () => {
    const entry = new vvc1SampleEntry();
    entry.vvcC = parseVvcC('00');

    expect(entry.getCodec()).toBe('vvc1.1.L83.CA');
  });
});

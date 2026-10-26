import { mp4aSampleEntry, mp4vSampleEntry } from '../src/boxes/sampleentries/sampleentry';
import type { esdsBox } from '../src/boxes/esds';
import type { waveBox } from '../src/boxes/qt/wave';
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
});

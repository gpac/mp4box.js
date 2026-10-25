import { mp4aSampleEntry, vp09SampleEntry } from '../src/boxes/sampleentries/sampleentry';
import type { esdsBox } from '../src/boxes/esds';
import type { waveBox } from '../src/boxes/qt/wave';
import type { vpcCBox } from '../src/boxes/vpcC';

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
});

import { mp4aSampleEntry } from '../src/boxes/sampleentries/sampleentry';
import type { esdsBox } from '../src/boxes/esds';
import type { waveBox } from '../src/boxes/qt/wave';

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
});

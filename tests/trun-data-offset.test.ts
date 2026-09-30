import type { ISOFile } from '../entries/all';
import { moofBox, trafBox } from '../src/boxes/defaults';
import { tfhdBox } from '../src/boxes/tfhd';
import { trunBox } from '../src/boxes/trun';
import {
  TFHD_FLAG_DEFAULT_BASE_IS_MOOF,
  TRUN_FLAGS_DATA_OFFSET,
  TRUN_FLAGS_SIZE,
} from '../src/constants';
import { getFilePath, loadAndGetInfo } from './common';

const MOOF_START = 10000;

interface RunSpec {
  dataOffset?: number;
  sizes: Array<number>;
}

function createTraf(trackId: number, tfhdFlags: number, runs: Array<RunSpec>) {
  const traf = new trafBox();
  const tfhd = traf.addBox(new tfhdBox());
  tfhd.track_id = trackId;
  tfhd.flags = tfhdFlags;

  for (const run of runs) {
    const trun = traf.addBox(new trunBox());
    trun.flags = TRUN_FLAGS_SIZE | (run.dataOffset !== undefined ? TRUN_FLAGS_DATA_OFFSET : 0);
    trun.data_offset = run.dataOffset ?? 0;
    trun.sample_count = run.sizes.length;
    trun.sample_size = run.sizes;
  }

  return traf;
}

function appendMoof(mp4: ISOFile, trafs: Array<trafBox>) {
  const moof = new moofBox();
  moof.start = MOOF_START;
  for (const traf of trafs) moof.addBox(traf);
  mp4.moofs.push(moof);
  mp4.updateSampleLists();
}

function lastOffsets(mp4: ISOFile, trackId: number, count: number) {
  const trak = mp4.getTrackById(trackId);
  return trak.samples.slice(-count).map(sample => sample.offset);
}

async function loadTracks() {
  const { testFile } = getFilePath('isobmff', '01_simple.mp4');
  const { mp4 } = await loadAndGetInfo(testFile, true);
  const trackIdOf = (handler: string) => {
    const trak = mp4.moov?.traks.find(trak => trak.mdia?.hdlr?.handler === handler);
    if (!trak) throw new Error(`Missing ${handler} track`);
    return trak.tkhd.track_id;
  };
  return { mp4, videoId: trackIdOf('vide'), audioId: trackIdOf('soun') };
}

describe('Track run data offsets', () => {
  test('Honours the data offset of every run when tracks are interleaved', async () => {
    const { mp4, videoId, audioId } = await loadTracks();

    // mdat layout: [video 1-2][audio 1-2][video 3-4][audio 3-4]
    appendMoof(mp4, [
      createTraf(videoId, TFHD_FLAG_DEFAULT_BASE_IS_MOOF, [
        { dataOffset: 200, sizes: [100, 100] },
        { dataOffset: 500, sizes: [100, 100] },
      ]),
      createTraf(audioId, TFHD_FLAG_DEFAULT_BASE_IS_MOOF, [
        { dataOffset: 400, sizes: [50, 50] },
        { dataOffset: 700, sizes: [50, 50] },
      ]),
    ]);

    expect(lastOffsets(mp4, videoId, 4)).toEqual([10200, 10300, 10500, 10600]);
    expect(lastOffsets(mp4, audioId, 4)).toEqual([10400, 10450, 10700, 10750]);
  });

  test('Continues after the previous run when a run has no data offset', async () => {
    const { mp4, videoId } = await loadTracks();

    appendMoof(mp4, [
      createTraf(videoId, TFHD_FLAG_DEFAULT_BASE_IS_MOOF, [
        { dataOffset: 200, sizes: [100, 100] },
        { sizes: [100, 100] },
      ]),
    ]);

    expect(lastOffsets(mp4, videoId, 4)).toEqual([10200, 10300, 10400, 10500]);
  });

  test('Uses the end of the preceding track fragment as base when no base is declared', async () => {
    const { mp4, videoId, audioId } = await loadTracks();

    // Neither base-data-offset nor default-base-is-moof: the audio base is where the video data ends
    appendMoof(mp4, [
      createTraf(videoId, 0, [{ dataOffset: 200, sizes: [100, 100] }]),
      createTraf(audioId, 0, [{ dataOffset: 0, sizes: [50, 50] }]),
    ]);

    expect(lastOffsets(mp4, videoId, 2)).toEqual([10200, 10300]);
    expect(lastOffsets(mp4, audioId, 2)).toEqual([10400, 10450]);
  });

  test('Uses the base of an empty preceding track fragment as the end of its data', async () => {
    const { mp4, videoId, audioId } = await loadTracks();

    // The video traf has no samples, so its data ends where it starts: at the moof start
    appendMoof(mp4, [
      createTraf(videoId, 0, [{ sizes: [] }]),
      createTraf(audioId, 0, [{ dataOffset: 0, sizes: [50, 50] }]),
    ]);

    expect(lastOffsets(mp4, audioId, 2)).toEqual([10000, 10050]);
  });
});

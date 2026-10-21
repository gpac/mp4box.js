import { createFile, DataStream, MP4BoxBuffer, type ISOFile } from '../entries/all';
import { mfhdBox } from '../src/boxes/mfhd';
import { moofBox, trafBox } from '../src/boxes/defaults';
import { tfhdBox } from '../src/boxes/tfhd';
import { trunBox } from '../src/boxes/trun';
import {
  TFHD_FLAG_BASE_DATA_OFFSET,
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

describe('Track run data offset edge cases', () => {
  test('Applies the offset of an empty first run before an implicit run', async () => {
    const { mp4, videoId } = await loadTracks();
    appendMoof(mp4, [
      createTraf(videoId, TFHD_FLAG_DEFAULT_BASE_IS_MOOF, [
        { dataOffset: 200, sizes: [] },
        { sizes: [100, 100] },
      ]),
    ]);
    expect(lastOffsets(mp4, videoId, 2)).toEqual([10200, 10300]);
  });

  test('Applies the offset of an empty middle run before an implicit run', async () => {
    const { mp4, videoId } = await loadTracks();
    appendMoof(mp4, [
      createTraf(videoId, TFHD_FLAG_DEFAULT_BASE_IS_MOOF, [
        { dataOffset: 200, sizes: [100] },
        { dataOffset: 500, sizes: [] },
        { sizes: [100, 100] },
      ]),
    ]);
    expect(lastOffsets(mp4, videoId, 3)).toEqual([10200, 10500, 10600]);
  });

  test('Carries the endpoint of an empty final run into the next implicit traf', async () => {
    const { mp4, videoId, audioId } = await loadTracks();
    appendMoof(mp4, [
      createTraf(videoId, 0, [
        { dataOffset: 200, sizes: [100] },
        { dataOffset: 500, sizes: [] },
      ]),
      createTraf(audioId, 0, [{ sizes: [50, 50] }]),
    ]);
    expect(lastOffsets(mp4, audioId, 2)).toEqual([10500, 10550]);
  });

  test('Accepts signed negative offsets and an explicitly signalled zero offset', async () => {
    const { mp4, videoId } = await loadTracks();
    appendMoof(mp4, [
      createTraf(videoId, TFHD_FLAG_DEFAULT_BASE_IS_MOOF, [
        { dataOffset: -200, sizes: [50, 50] },
        { dataOffset: 0, sizes: [100, 100] },
        { sizes: [50] },
      ]),
    ]);
    expect(lastOffsets(mp4, videoId, 5)).toEqual([9800, 9850, 10000, 10100, 10200]);
  });

  test('Uses an explicit base even when default-base-is-moof is set', async () => {
    const { mp4, videoId } = await loadTracks();
    const traf = createTraf(videoId, TFHD_FLAG_BASE_DATA_OFFSET | TFHD_FLAG_DEFAULT_BASE_IS_MOOF, [
      { dataOffset: -200, sizes: [100] },
      { dataOffset: 0, sizes: [100] },
      { sizes: [100] },
    ]);
    traf.tfhd.base_data_offset = 20000;
    appendMoof(mp4, [traf]);
    expect(lastOffsets(mp4, videoId, 3)).toEqual([19800, 20000, 20100]);
  });

  test('Does not use a data_offset value when its flag is absent', async () => {
    const { mp4, videoId } = await loadTracks();
    const traf = createTraf(videoId, TFHD_FLAG_DEFAULT_BASE_IS_MOOF, [
      { dataOffset: 200, sizes: [100] },
      { sizes: [100] },
    ]);
    traf.truns[1].data_offset = 999;
    appendMoof(mp4, [traf]);
    expect(lastOffsets(mp4, videoId, 2)).toEqual([10200, 10300]);
  });

  test('Resets an inherited base through a traf with no runs', async () => {
    const { mp4, videoId, audioId } = await loadTracks();
    const empty = createTraf(videoId, TFHD_FLAG_BASE_DATA_OFFSET, []);
    empty.tfhd.base_data_offset = 20000;
    appendMoof(mp4, [
      createTraf(videoId, 0, [{ dataOffset: 200, sizes: [100] }]),
      empty,
      createTraf(audioId, 0, [{ sizes: [50] }]),
    ]);
    expect(lastOffsets(mp4, audioId, 1)).toEqual([20000]);
  });

  test('Starts a new moof at its own implicit base', async () => {
    const { mp4, videoId } = await loadTracks();
    appendMoof(mp4, [createTraf(videoId, 0, [{ dataOffset: 200, sizes: [100] }])]);
    const moof = new moofBox();
    moof.start = 20000;
    moof.addBox(createTraf(videoId, 0, [{ dataOffset: 300, sizes: [100] }]));
    mp4.moofs.push(moof);
    mp4.updateSampleLists();
    expect(lastOffsets(mp4, videoId, 2)).toEqual([10200, 20300]);
  });
});

test('Extracts the correct bytes after an empty run with a data offset', () => {
  const init = createFile();
  const trackId = init.addTrack();
  const moof = new moofBox();
  moof.addBox(new mfhdBox()).sequence_number = 1;
  const traf = moof.addBox(
    createTraf(trackId, TFHD_FLAG_DEFAULT_BASE_IS_MOOF, [
      { dataOffset: 0, sizes: [] },
      { sizes: [4, 4] },
    ]),
  );
  moof.write(new DataStream());
  traf.truns[0].data_offset = moof.size + 8;

  const output = new DataStream();
  init.write(output);
  moof.write(output);
  output.writeUint32(16);
  output.writeString('mdat');
  output.writeUint8Array([11, 22, 33, 44, 55, 66, 77, 88]);

  const parsed = createFile(true);
  parsed.appendBuffer(MP4BoxBuffer.fromArrayBuffer(output.buffer, 0), true);
  const track = parsed.getTrackById(trackId);
  expect(Array.from(parsed.getSample(track, 0).data)).toEqual([11, 22, 33, 44]);
  expect(Array.from(parsed.getSample(track, 1).data)).toEqual([55, 66, 77, 88]);
});

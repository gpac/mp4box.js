import fs from 'fs';
import { createFile, ISOFile, MP4BoxBuffer, MultiBufferStream } from '../entries/all';
import { waveBox } from '../src/boxes/qt/wave';
import { mp4aSampleEntry } from '../src/boxes/sampleentries/sampleentry';
import { getFilePath, loadAndGetInfo } from './common';

// Saves the segments to a file
const DEBUG_MODE = false;

function saveBufferToFile(buffer: ArrayBuffer, id: string, init: boolean) {
  if (!DEBUG_MODE) return;
  const fileName = `/tmp/${id}.mp4`;
  fs.writeFileSync(fileName, new DataView(buffer), { flag: init ? 'w' : 'a' });
}

function moveDirectEsdsIntoWave(sampleEntry: mp4aSampleEntry) {
  const esds = sampleEntry.esds;
  if (!esds) {
    throw new Error('Missing direct esds box');
  }

  const wave = new waveBox();
  wave.esds = esds;
  wave.boxes = [esds];

  sampleEntry.esds = undefined;
  sampleEntry.wave = wave;
  sampleEntry.boxes = sampleEntry.boxes?.map(box => (box.type === 'esds' ? wave : box)) ?? [wave];
}

type LoadedMp4 = Awaited<ReturnType<typeof loadAndGetInfo>>['mp4'];

interface QuickTimeWaveEsdsFixture {
  mp4: LoadedMp4;
  audioTrackId: number;
  sampleEntry: mp4aSampleEntry;
}

async function loadMp4WithQuickTimeWaveEsds(): Promise<QuickTimeWaveEsdsFixture> {
  const { testFile } = getFilePath('isobmff', '01_simple.mp4');
  const { mp4 } = await loadAndGetInfo(testFile, true, true);

  const audioTrack = mp4.moov?.traks.find(trak => trak.mdia?.hdlr?.handler === 'soun');
  if (!audioTrack) {
    throw new Error('Missing audio track');
  }
  const sampleEntry = audioTrack.mdia.minf.stbl.stsd.entries[0] as mp4aSampleEntry;
  moveDirectEsdsIntoWave(sampleEntry);

  return {
    mp4,
    audioTrackId: audioTrack.tkhd.track_id,
    sampleEntry,
  };
}

function getInitSegmentSampleEntry(buffer: ArrayBuffer, audioTrackId: number): mp4aSampleEntry {
  const initMp4 = createFile(true);
  initMp4.appendBuffer(MP4BoxBuffer.fromArrayBuffer(buffer, 0));
  initMp4.flush();

  const initAudioTrack = initMp4.getTrackById(audioTrackId);
  return initAudioTrack.mdia.minf.stbl.stsd.entries[0] as mp4aSampleEntry;
}

describe('File Segmentation', () => {
  it('by sample count', async ({ task }) => {
    const { testFile } = getFilePath('isobmff', '01_simple.mp4');
    const { mp4 } = await loadAndGetInfo(testFile, true, true);

    // Create a output stream
    const out = new MultiBufferStream();

    // Set up the segmentation options
    mp4.setSegmentOptions(201, undefined, {
      nbSamples: 100,
      nbSamplesPerFragment: 50,
      rapAlignement: false,
    });

    // Initialize the segmentation
    let offset = 0;
    const init = mp4.initializeSegmentation();

    // Write the initialization segments to the output stream
    out.insertBuffer(MP4BoxBuffer.fromArrayBuffer(init.buffer, offset));
    offset += init.buffer.byteLength;
    saveBufferToFile(init.buffer, task.id, true);

    // Write segments to the output stream
    let segmentCount = 0;
    mp4.onSegment = (id, user, buffer, _, last) => {
      out.insertBuffer(MP4BoxBuffer.fromArrayBuffer(buffer, offset));
      offset += buffer.byteLength;
      segmentCount++;
      saveBufferToFile(buffer, task.id, false);

      // Check if the last segment is reached
      if (segmentCount === 3) expect(last).toBe(true);
      else expect(last).toBe(false);
    };

    // Start the segmentation process
    mp4.start();

    // Create file from the output stream
    const newMP4 = createFile(true, out);
    newMP4.flush();

    // Assertions
    expect(newMP4.getInfo().tracks.length).toBe(1);
    expect(newMP4.getTrackById(201).samples.length).toBe(250);
    expect(segmentCount).toBe(3);
    expect(newMP4.getBoxes('moof', false).length).toBe(5);
    expect(out.getAbsoluteEndPosition()).toBe(151_838);
  });

  it('by segment size', async ({ task }) => {
    const { testFile } = getFilePath('isobmff', '01_simple.mp4');
    const { mp4 } = await loadAndGetInfo(testFile, true, true);

    // Create a output stream
    const out = new MultiBufferStream();

    // Set up the segmentation options
    mp4.setSegmentOptions(201, undefined, {
      sizePerSegment: 25_000, // 20KB per segment
      rapAlignement: false,
    });

    // Initialize the segmentation
    let offset = 0;
    const init = mp4.initializeSegmentation();

    // Write the initialization segments to the output stream
    out.insertBuffer(MP4BoxBuffer.fromArrayBuffer(init.buffer, offset));
    offset += init.buffer.byteLength;
    saveBufferToFile(init.buffer, task.id, true);

    // Write segments to the output stream
    let segmentCount = 0;
    mp4.onSegment = (id, user, buffer, _nextSample, _last) => {
      out.insertBuffer(MP4BoxBuffer.fromArrayBuffer(buffer, offset));
      offset += buffer.byteLength;
      segmentCount++;
      expect(buffer.byteLength).toBeCloseTo(25000, -4); // Allow some variance in size
      saveBufferToFile(buffer, task.id, false);
    };

    // Start the segmentation process
    mp4.start();

    // Create file from the output stream
    const newMP4 = createFile(true, out);
    newMP4.flush();

    // Assertions
    expect(newMP4.getInfo().tracks.length).toBe(1);
    expect(newMP4.getTrackById(201).samples.length).toBe(250);
    expect(segmentCount).toBe(6);
    expect(newMP4.getBoxes('moof', false).length).toBe(6);
    expect(out.getAbsoluteEndPosition()).toBe(151_930);
  });

  it('by rap alignment', async ({ task }) => {
    const { testFile } = getFilePath('isobmff', '01_simple.mp4');
    const { mp4 } = await loadAndGetInfo(testFile, true, true);

    // Create a output stream
    const out = new MultiBufferStream();

    // Set up the segmentation options
    mp4.setSegmentOptions(201, undefined, {
      nbSamples: 10,
      rapAlignement: true,
    });

    // Initialize the segmentation
    let offset = 0;
    const init = mp4.initializeSegmentation();

    // Write the initialization segments to the output stream
    out.insertBuffer(MP4BoxBuffer.fromArrayBuffer(init.buffer, offset));
    offset += init.buffer.byteLength;
    saveBufferToFile(init.buffer, task.id, true);

    // Write segments to the output stream
    let segmentCount = 0;
    mp4.onSegment = (id, user, buffer, _nextSample, _last) => {
      out.insertBuffer(MP4BoxBuffer.fromArrayBuffer(buffer, offset));
      offset += buffer.byteLength;
      segmentCount++;
      saveBufferToFile(buffer, task.id, false);
    };

    // Start the segmentation process
    mp4.start();

    // Create file from the output stream
    const newMP4 = createFile(true, out);
    newMP4.flush();

    // Assertions
    expect(newMP4.getInfo().tracks.length).toBe(1);
    expect(newMP4.getTrackById(201).samples.length).toBe(250);
    expect(segmentCount).toBe(10);
    expect(newMP4.getBoxes('moof', false).length).toBe(10);
    expect(out.getAbsoluteEndPosition()).toBe(152_298);
  });

  it('by multiplexing', async ({ task }) => {
    const { testFile } = getFilePath('isobmff', '01_simple.mp4');
    const { mp4 } = await loadAndGetInfo(testFile, true, true);

    // Create a output stream
    const out = new MultiBufferStream();

    // Set up the segmentation options
    mp4.setSegmentOptions(101, undefined, {
      nbSamples: 50,
      rapAlignement: false,
    });
    mp4.setSegmentOptions(201, undefined, {
      nbSamples: 50,
      rapAlignement: false,
    });

    // Initialize the segmentation
    let offset = 0;
    const init = mp4.initializeSegmentation();

    // Write the initialization segments to the output stream
    out.insertBuffer(MP4BoxBuffer.fromArrayBuffer(init.buffer, offset));
    offset += init.buffer.byteLength;
    saveBufferToFile(init.buffer, task.id, true);

    // Write segments to the output stream
    let segmentCount = 0;
    mp4.onSegment = (id, user, buffer, _nextSample, _last) => {
      out.insertBuffer(MP4BoxBuffer.fromArrayBuffer(buffer, offset));
      offset += buffer.byteLength;
      segmentCount++;
      saveBufferToFile(buffer, task.id, false);
    };

    // Start the segmentation process
    mp4.start();

    // Create file from the output stream
    const newMP4 = createFile(true, out);
    newMP4.flush();

    // Assertions
    expect(newMP4.getInfo().tracks.length).toBe(2);
    expect(newMP4.getTrackById(101).samples.length).toBe(218);
    expect(newMP4.getTrackById(201).samples.length).toBe(250);
    expect(segmentCount).toBe(10);
    expect(newMP4.getBoxes('moof', false).length).toBe(10);
    expect(out.getAbsoluteEndPosition()).toBe(203_175);
  });

  it('resets segmentation state on seek', async () => {
    const { testFile } = getFilePath('isobmff', '01_simple.mp4');
    const { mp4 } = await loadAndGetInfo(testFile, true, true);

    mp4.setSegmentOptions(201, undefined, {
      nbSamples: 100,
      nbSamplesPerFragment: 50,
      rapAlignement: false,
    });
    mp4.initializeSegmentation();
    mp4.onSegment = () => undefined;

    mp4.start();

    const fragTrack = mp4.fragmentedTracks.find(track => track.id === 201);
    expect(fragTrack).toBeDefined();
    if (!fragTrack) {
      throw new Error('Missing fragmented track #201');
    }

    mp4.seek(0, false);

    expect(fragTrack.state.lastFragmentSampleNumber).toBe(fragTrack.trak.nextSample);
    expect(fragTrack.state.lastSegmentSampleNumber).toBe(fragTrack.trak.nextSample);
    expect(fragTrack.state.accumulatedSize).toBe(0);
    expect(fragTrack.segmentStream).toBeUndefined();
    expect(() => mp4.start()).not.toThrow();
  });

  it('resets segmentation state on forward seek before processing', async () => {
    const { testFile } = getFilePath('isobmff', '01_simple.mp4');
    const { mp4 } = await loadAndGetInfo(testFile, true, true);

    mp4.setSegmentOptions(201, undefined, {
      nbSamples: 100,
      nbSamplesPerFragment: 50,
      rapAlignement: false,
    });
    mp4.initializeSegmentation();

    const fragTrack = mp4.fragmentedTracks.find(track => track.id === 201);
    expect(fragTrack).toBeDefined();
    if (!fragTrack) {
      throw new Error('Missing fragmented track #201');
    }

    mp4.seek(3, false);

    expect(fragTrack.trak.nextSample).toBeGreaterThan(0);
    expect(fragTrack.state.lastFragmentSampleNumber).toBe(fragTrack.trak.nextSample);
    expect(fragTrack.state.lastSegmentSampleNumber).toBe(fragTrack.trak.nextSample);
    expect(fragTrack.state.accumulatedSize).toBe(0);
    expect(fragTrack.segmentStream).toBeUndefined();
  });

  it('resets segmentation state on backward seek after a forward seek', async () => {
    const { testFile } = getFilePath('isobmff', '01_simple.mp4');
    const { mp4 } = await loadAndGetInfo(testFile, true, true);

    mp4.setSegmentOptions(201, undefined, {
      nbSamples: 100,
      nbSamplesPerFragment: 50,
      rapAlignement: false,
    });
    mp4.initializeSegmentation();

    const fragTrack = mp4.fragmentedTracks.find(track => track.id === 201);
    expect(fragTrack).toBeDefined();
    if (!fragTrack) {
      throw new Error('Missing fragmented track #201');
    }

    mp4.seek(3, false);
    const forwardSample = fragTrack.trak.nextSample;
    expect(forwardSample).toBeGreaterThan(0);

    mp4.seek(0, false);

    expect(fragTrack.trak.nextSample).toBeLessThan(forwardSample);
    expect(fragTrack.state.lastFragmentSampleNumber).toBe(fragTrack.trak.nextSample);
    expect(fragTrack.state.lastSegmentSampleNumber).toBe(fragTrack.trak.nextSample);
    expect(fragTrack.state.accumulatedSize).toBe(0);
    expect(fragTrack.segmentStream).toBeUndefined();
  });

  it('with one init segment per fragmented track', async () => {
    const { testFile } = getFilePath('isobmff', '01_simple.mp4');
    const { mp4 } = await loadAndGetInfo(testFile, true, true);

    mp4.setSegmentOptions(101, undefined, {
      nbSamples: 50,
      rapAlignement: false,
    });
    mp4.setSegmentOptions(201, undefined, {
      nbSamples: 50,
      rapAlignement: false,
    });

    const initSegments = mp4.initializeSegmentation('per-track');
    expect(initSegments.length).toBe(2);

    for (const initSegment of initSegments) {
      const initMp4 = createFile();
      initMp4.appendBuffer(MP4BoxBuffer.fromArrayBuffer(initSegment.buffer, 0));
      initMp4.flush();

      const info = initMp4.getInfo();
      expect(info.tracks.length).toBe(1);
      expect(info.tracks[0].id).toBe(initSegment.id);
      expect(initMp4.moov.mvex.trexs.length).toBe(1);
      expect(initMp4.moov.mvex.trexs[0].track_id).toBe(initSegment.id);
    }
  });

  it('with explicit combined mode', async () => {
    const { testFile } = getFilePath('isobmff', '01_simple.mp4');
    const { mp4 } = await loadAndGetInfo(testFile, true, true);

    mp4.setSegmentOptions(101, undefined, {
      nbSamples: 50,
      rapAlignement: false,
    });
    mp4.setSegmentOptions(201, undefined, {
      nbSamples: 50,
      rapAlignement: false,
    });

    const defaultInit = mp4.initializeSegmentation();
    const combinedInit = mp4.initializeSegmentation('combined');

    expect(combinedInit.tracks.map(track => track.id)).toEqual(
      defaultInit.tracks.map(track => track.id),
    );

    const initMp4 = createFile();
    initMp4.appendBuffer(MP4BoxBuffer.fromArrayBuffer(combinedInit.buffer, 0));
    initMp4.flush();
    expect(initMp4.getInfo().tracks.length).toBe(2);
  });

  describe('given an mp4a sample entry with QuickTime wave esds', () => {
    describe('when MSE normalization is enabled (default)', () => {
      it('writes a direct esds in init segment and restores source sample entry state', async () => {
        const { mp4, audioTrackId, sampleEntry } = await loadMp4WithQuickTimeWaveEsds();

        expect(sampleEntry).toBeInstanceOf(mp4aSampleEntry);
        expect(sampleEntry.wave).toBeInstanceOf(waveBox);
        expect(sampleEntry.esds).toBeUndefined();
        expect(sampleEntry.boxes?.some(box => box.type === 'wave')).toBe(true);
        expect(sampleEntry.boxes?.some(box => box.type === 'esds')).toBe(false);

        const originalWave = sampleEntry.wave;

        mp4.setSegmentOptions(audioTrackId, undefined, { nbSamples: 50 });
        const initSegment = mp4.initializeSegmentation();
        const initSampleEntry = getInitSegmentSampleEntry(initSegment.buffer, audioTrackId);

        expect(initSampleEntry.boxes?.some(box => box.type === 'esds')).toBe(true);
        expect(initSampleEntry.boxes?.some(box => box.type === 'wave')).toBe(false);

        expect(sampleEntry.wave).toBe(originalWave);
        expect(sampleEntry.esds).toBeUndefined();
        expect(sampleEntry.boxes?.some(box => box.type === 'wave')).toBe(true);
        expect(sampleEntry.boxes?.some(box => box.type === 'esds')).toBe(false);
      });
    });

    describe('when MSE normalization is disabled', () => {
      it('preserves nested wave esds in init segment and source sample entry state', async () => {
        const { mp4, audioTrackId, sampleEntry } = await loadMp4WithQuickTimeWaveEsds();

        const originalWave = sampleEntry.wave;

        mp4.setSegmentOptions(audioTrackId, undefined, {
          nbSamples: 50,
          normalizeAudioSampleEntriesForMSE: false,
        });
        const initSegment = mp4.initializeSegmentation();
        const initSampleEntry = getInitSegmentSampleEntry(initSegment.buffer, audioTrackId);

        expect(initSampleEntry.wave).toBeInstanceOf(waveBox);
        expect(initSampleEntry.esds).toBeUndefined();
        expect(initSampleEntry.boxes?.some(box => box.type === 'wave')).toBe(true);
        expect(initSampleEntry.boxes?.some(box => box.type === 'esds')).toBe(false);

        expect(sampleEntry.wave).toBe(originalWave);
        expect(sampleEntry.esds).toBeUndefined();
        expect(sampleEntry.boxes?.some(box => box.type === 'wave')).toBe(true);
        expect(sampleEntry.boxes?.some(box => box.type === 'esds')).toBe(false);
      });
    });

    describe('when writing an initialization segment directly without MSE normalization track ids', () => {
      it('preserves nested wave esds in init segment and source sample entry state', async () => {
        const { mp4, audioTrackId, sampleEntry } = await loadMp4WithQuickTimeWaveEsds();
        const originalWave = sampleEntry.wave;

        const initBuffer = ISOFile.writeInitializationSegment(mp4.ftyp, mp4.moov, 0);
        const initSampleEntry = getInitSegmentSampleEntry(initBuffer, audioTrackId);

        expect(initSampleEntry.wave).toBeInstanceOf(waveBox);
        expect(initSampleEntry.esds).toBeUndefined();
        expect(initSampleEntry.boxes?.some(box => box.type === 'wave')).toBe(true);
        expect(initSampleEntry.boxes?.some(box => box.type === 'esds')).toBe(false);

        expect(sampleEntry.wave).toBe(originalWave);
        expect(sampleEntry.esds).toBeUndefined();
        expect(sampleEntry.boxes?.some(box => box.type === 'wave')).toBe(true);
        expect(sampleEntry.boxes?.some(box => box.type === 'esds')).toBe(false);
      });
    });
  });
});

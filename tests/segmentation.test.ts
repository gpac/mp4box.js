import fs from 'fs';
import { createFile, MP4BoxBuffer, MultiBufferStream } from '../entries/all';
import { getFilePath, loadAndGetInfo } from './common';

// Saves the segments to a file
const DEBUG_MODE = false;

function saveBufferToFile(buffer: ArrayBuffer, id: string, init: boolean) {
  if (!DEBUG_MODE) return;
  const fileName = `/tmp/${id}.mp4`;
  fs.writeFileSync(fileName, new DataView(buffer), { flag: init ? 'w' : 'a' });
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
});

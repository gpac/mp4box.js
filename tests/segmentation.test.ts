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
    out.insertBuffer(init.buffer);
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
    out.insertBuffer(init.buffer);
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
    out.insertBuffer(init.buffer);
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
    out.insertBuffer(init.buffer);
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
});

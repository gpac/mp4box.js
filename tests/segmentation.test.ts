import { createFile, MP4BoxBuffer, MultiBufferStream } from '../entries/all';
import { getFilePath, loadAndGetInfo } from './common';

describe('File Segmentation', () => {
  it('01_simple segmentation', async () => {
    const { testFile } = getFilePath('isobmff', '01_simple.mp4');
    const { mp4 } = await loadAndGetInfo(testFile, true, true);

    // Create a output stream
    const out = new MultiBufferStream();

    // Set up the segmentation options
    mp4.setSegmentOptions(201, null, {
      nbSamples: 50,
      rapAlignement: false,
    });

    // Initialize the segmentation
    let offset = 0;
    const init = mp4.initializeSegmentation();

    // Write the initialization segments to the output stream
    for (const initSegs of init) {
      out.insertBuffer(initSegs.buffer);
      offset += initSegs.buffer.byteLength;
    }

    // Write segments to the output stream
    let segmentCount = 0;
    mp4.onSegment = (id, user, buffer, _nextSample, _last) => {
      out.insertBuffer(MP4BoxBuffer.fromArrayBuffer(buffer, offset));
      offset += buffer.byteLength;
      segmentCount++;
    };

    // Start the segmentation process
    mp4.start();

    // Create file from the output stream
    const newMP4 = createFile(true, out);
    newMP4.flush();

    // Assertions
    expect(newMP4.getTrackById(201).samples.length).toBe(250);
    expect(out.getAbsoluteEndPosition()).toBe(174410);
    expect(segmentCount).toBe(5);
  });
});

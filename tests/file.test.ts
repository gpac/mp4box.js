import { createFile, DataStream, Endianness, MP4BoxBuffer, type Sample } from '../entries/all';
import { getFilePath, getFileRange, loadAndGetInfo } from './common';

async function collectTestSamples() {
  const { testFile } = getFilePath('isobmff', '17_negative_ctso.mp4');
  const { mp4 } = await loadAndGetInfo(testFile, true, true);

  // Extract samples from the MP4 file
  mp4.setExtractionOptions(1, null, { nbSamples: 100 });

  // Create a new promise to handle the extraction
  const samples = await new Promise<Array<Sample>>(resolve => {
    // Set up the onSamples callback to resolve the promise
    mp4.onSamples = (id, user, extracted) => resolve(extracted);

    // Start the extraction process
    mp4.start();
  });

  // Extract the decoder configuration
  const avcC = new DataStream();
  avcC.endianness = Endianness.BIG_ENDIAN;
  mp4.getBox('avcC').write(avcC);

  // Wrap it as an ArrayBuffer
  const decoderConfig = new ArrayBuffer(avcC.buffer.byteLength - 8);
  new Uint8Array(decoderConfig).set(new Uint8Array(avcC.buffer, 8));

  return { samples, decoderConfig };
}

describe('File Creation', () => {
  it('should create a valid file', async () => {
    // Get test samples
    const { samples, decoderConfig } = await collectTestSamples();

    // Create a new MP4 file
    const mp4 = createFile();

    // Create a new track
    const track = mp4.addTrack({
      timescale: 100,
      avcDecoderConfigRecord: decoderConfig,
      width: 320,
      height: 180,
    });

    // Add samples to the track
    for (const sample of samples) {
      mp4.addSample(track, sample.data, {
        duration: sample.duration,
        cts: sample.cts,
        dts: sample.dts,
        is_sync: sample.is_sync,
      });
    }

    // Output the file to a buffer
    const ds = new DataStream();
    ds.endianness = Endianness.BIG_ENDIAN;
    mp4.write(ds);

    // Create a new MP4 file from the output stream
    const newMP4 = createFile(true);
    newMP4.appendBuffer(MP4BoxBuffer.fromArrayBuffer(ds.buffer, 0), true);
    newMP4.flush();

    // Assertions
    expect(newMP4.getInfo().tracks.length).toBe(1);
    expect(newMP4.getTrackById(1).samples.length).toBe(100);
    expect(newMP4.getBoxes('moof', false).length).toBe(100);
    expect(ds.buffer.byteLength).toBe(40_591);
  });

  it('should not fail with incomplete mdat', async () => {
    const { testFile } = getFilePath('isobmff', '17_negative_ctso.mp4');
    const mp4 = createFile(false);

    // Load only until the first sample
    const mdatOffset = 17_105 + 8; // ftyp + moov + mdat header
    const firstSampleSize = 2_895; // mdat header + first sample size
    await getFileRange(testFile, data => mp4.appendBuffer(data), 0, mdatOffset + firstSampleSize);

    // Setup for extraction
    mp4.setExtractionOptions(1, null, { nbSamples: 1 });
    let sampleCount = 0;
    mp4.onSamples = (id, user, extracted) => (sampleCount += extracted.length);
    mp4.start();

    // Check if the sample is extracted correctly
    expect(sampleCount).toBe(0);
  });
});

import * as MP4Box from '../entries/all';

describe('File Creation', () => {
  it('addSample and segmentation', async () => {
    const f = MP4Box.createFile();

    const promise = new Promise<number>(resolve => {
      f.onSegment = function (id, _user, _buffer, _sampleNum) {
        resolve(id);
      };

      const track_id = f.addTrack();
      f.setSegmentOptions(track_id, null, { nbSamples: 2 });
      f.initializeSegmentation();
      f.start();
      f.addSample(track_id, new Uint8Array(100));
      f.addSample(track_id, new Uint8Array(100));
    });

    await expect(promise).resolves.toBe(1);
  });

  it('addSample and file save', () => {
    const f = MP4Box.createFile();
    const track_id = f.addTrack();
    f.addSample(track_id, new Uint8Array(100));
    f.addSample(track_id, new Uint8Array(100));
    const blob = f.save('test.mp4');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBe(943);
  });

  it('Create simple stpp track and save file', () => {
    const f = MP4Box.createFile();
    const track_id = f.addTrack({ type: 'stpp', hdlr: 'subt', namespace: 'mynamespace' });
    f.addSample(track_id, new TextEncoder().encode('<xml></xml>'));
    f.addSample(track_id, new TextEncoder().encode('<xml></xml>'));
    const blob = f.save('stpp-track.mp4');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBe(687);
  });
});

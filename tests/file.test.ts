import { createFile } from '../entries/all';

describe('File Creation', () => {
  it('addSample and file save', () => {
    const f = createFile(true);
    const track_id = f.addTrack();
    f.addSample(track_id, new Uint8Array(100));
    f.addSample(track_id, new Uint8Array(100));
    const blob = f.save('test.mp4');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBe(972);
  });

  it('Create simple stpp track and save file', () => {
    const f = createFile(true);
    const track_id = f.addTrack({ type: 'stpp', hdlr: 'subt', namespace: 'mynamespace' });
    f.addSample(track_id, new TextEncoder().encode('<xml></xml>'));
    f.addSample(track_id, new TextEncoder().encode('<xml></xml>'));
    const blob = f.save('stpp-track.mp4');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBe(730);
  });
});

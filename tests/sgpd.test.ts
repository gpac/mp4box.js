import { createFile, Log, MP4BoxBuffer, type sgpdBox } from '../entries/all';

function hex(value: string) {
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(value.slice(2 * i, 2 * i + 2), 16);
  return bytes;
}

function parseSgpd(bytes: Uint8Array) {
  const mp4 = createFile();
  const onError = vi.fn();
  mp4.onError = onError;
  mp4.appendBuffer(MP4BoxBuffer.fromArrayBuffer(bytes.slice().buffer, 0));
  mp4.flush();
  const sgpd = mp4.boxes.find(b => b.type === 'sgpd') as sgpdBox;
  return { mp4, sgpd, onError };
}

describe('sgpd box', () => {
  beforeEach(() => {
    vi.spyOn(Log, 'warn').mockReturnValue(undefined);
    vi.spyOn(Log, 'info').mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stops on unknown entries without a size (version 0, huge entry_count)', () => {
    // size 20, 'sgpd', version 0, grouping_type 'xxxx', entry_count 0xFFFFFFFF
    const { sgpd, onError } = parseSgpd(
      hex('00000014' + '73677064' + '00000000' + '78787878' + 'ffffffff'),
    );

    expect(sgpd.grouping_type).toBe('xxxx');
    expect(sgpd.entries).toEqual([]);
    expect(onError).not.toHaveBeenCalled();
  });

  it('stops on unknown entries without a size (version 2)', () => {
    // size 32, 'sgpd', version 2, grouping_type 'xxxx', default index 1, entry_count 1000, 8 bytes
    const { sgpd } = parseSgpd(
      hex(
        '00000020' +
          '73677064' +
          '02000000' +
          '78787878' +
          '00000001' +
          '000003e8' +
          '0102030405060708',
      ),
    );

    expect(sgpd.default_group_description_index).toBe(1);
    expect(sgpd.entries).toEqual([]);
  });

  it('still reads unknown entries when version 1 gives their size', () => {
    // size 32, 'sgpd', version 1, grouping_type 'xxxx', default_length 4, entry_count 2
    const { sgpd } = parseSgpd(
      hex(
        '00000020' +
          '73677064' +
          '01000000' +
          '78787878' +
          '00000004' +
          '00000002' +
          '0102030404030201',
      ),
    );

    expect(sgpd.entries).toHaveLength(2);
    expect(Array.from(sgpd.entries[0].data)).toEqual([1, 2, 3, 4]);
    expect(Array.from(sgpd.entries[1].data)).toEqual([4, 3, 2, 1]);
  });

  it('still reads known entries in version 0', () => {
    // size 24, 'sgpd', version 0, grouping_type 'roll', entry_count 2, roll_distance -1 and 2
    const { sgpd } = parseSgpd(
      hex('00000018' + '73677064' + '00000000' + '726f6c6c' + '00000002' + 'ffff0002'),
    );

    expect(
      sgpd.entries.map(e => (e as unknown as { roll_distance: number }).roll_distance),
    ).toEqual([-1, 2]);
  });
});

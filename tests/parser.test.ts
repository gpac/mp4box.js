import { createFile, Log, MP4BoxBuffer, type ISOFileParseOptions } from '../entries/all';

function ascii(value: string) {
  return new Uint8Array(Array.from(value, char => char.charCodeAt(0)));
}

function box(type: string, ...payload: Array<Uint8Array>) {
  const size = 8 + payload.reduce((total, part) => total + part.length, 0);
  const bytes = new Uint8Array(size);
  new DataView(bytes.buffer).setUint32(0, size);
  bytes.set(ascii(type), 4);
  let offset = 8;
  for (const part of payload) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return bytes;
}

function ftyp(brand: string) {
  return box('ftyp', ascii(brand), new Uint8Array(4), ascii(brand));
}

function parse(options: ISOFileParseOptions, ...boxes: Array<Uint8Array>) {
  const bytes = new Uint8Array(boxes.reduce((total, b) => total + b.length, 0));
  let offset = 0;
  for (const b of boxes) {
    bytes.set(b, offset);
    offset += b.length;
  }
  const mp4 = createFile(false, undefined, options);
  const onError = vi.fn();
  mp4.onError = onError;
  mp4.appendBuffer(MP4BoxBuffer.fromArrayBuffer(bytes.buffer, 0));
  mp4.flush();
  return { mp4, onError };
}

// A QuickTime user data atom inside an MP4 file, as written by some encoders
const moovWithUdta = () => box('moov', box('udta', box('©TIM', ascii('00:00:00:00')), box('free')));

describe('Box type', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockReturnValue(undefined);
    vi.spyOn(Log, 'warn');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('aborts parsing on an invalid box type by default', () => {
    const { mp4, onError } = parse({}, ftyp('mp42'), moovWithUdta(), box('free'));

    expect(mp4.boxes.map(b => b.type)).toEqual(['ftyp']);
    expect(onError).toHaveBeenCalled();
  });

  it('continues parsing on an invalid box type with allowInvalidBoxTypes', () => {
    const { mp4, onError } = parse(
      { allowInvalidBoxTypes: true },
      ftyp('mp42'),
      moovWithUdta(),
      box('free'),
    );

    expect(mp4.boxes.map(b => b.type)).toEqual(['ftyp', 'moov', 'free']);
    expect(mp4.getBox('udta')?.boxes?.map(b => b.type)).toEqual(['©TIM', 'free']);
    expect(onError).not.toHaveBeenCalled();
    expect(Log.warn).toHaveBeenCalledWith(
      'BoxParser',
      "Invalid box type: '©TIM', parsing it anyway",
    );
  });

  it('accepts any box type in a QuickTime file', () => {
    const { mp4, onError } = parse({}, ftyp('qt  '), box('free'), box('\0\0\0\0'), box('free'));

    expect(mp4.boxes.map(b => b.type)).toEqual(['ftyp', 'free', '\0\0\0\0', 'free']);
    expect(onError).not.toHaveBeenCalled();
  });
});

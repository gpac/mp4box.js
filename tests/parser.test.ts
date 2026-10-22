import { createFile, Log, MP4BoxBuffer, MultiBufferStream } from '../entries/all';
import type { udtaBox } from '../src/boxes/defaults';

function box(type: string, ...payload: Array<Uint8Array>) {
  const size = 8 + payload.reduce((total, part) => total + part.length, 0);
  const bytes = new Uint8Array(size);
  new DataView(bytes.buffer).setUint32(0, size);
  bytes.set(
    Array.from(type, char => char.charCodeAt(0)),
    4,
  );
  let offset = 8;
  for (const part of payload) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return bytes;
}

// QuickTime international text: 16-bit text size, 16-bit language code, text
function text(value: string) {
  const chars = Array.from(value, char => char.charCodeAt(0));
  return new Uint8Array([0, chars.length, 0x55, 0xc4, ...chars]);
}

function parse(...boxes: Array<Uint8Array>) {
  const bytes = new Uint8Array(boxes.reduce((total, b) => total + b.length, 0));
  let offset = 0;
  for (const b of boxes) {
    bytes.set(b, offset);
    offset += b.length;
  }
  const stream = new MultiBufferStream(MP4BoxBuffer.fromArrayBuffer(bytes.buffer, 0));
  return createFile(false, stream);
}

describe('Box type', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts QuickTime user data types that start with ©', () => {
    const error = vi.spyOn(Log, 'error');
    const mp4 = parse(
      box('udta', box('©TIM', text('00:00:00:00')), box('©nam', text('clip')), box('free')),
      box('free'),
    );

    expect(mp4.boxes.map(b => b.type)).toEqual(['udta', 'free']);
    const udta = mp4.boxes[0] as udtaBox;
    expect(udta.boxes?.map(b => b.type)).toEqual(['©TIM', '©nam', 'free']);
    expect(error).not.toHaveBeenCalled();
  });

  it('rejects a type with bytes that are not printable', () => {
    const error = vi.spyOn(Log, 'error').mockReturnValue(undefined);
    const mp4 = parse(box('free'), box('\0\0\0\0'), box('free'));

    expect(mp4.boxes.map(b => b.type)).toEqual(['free']);
    expect(error).toHaveBeenCalled();
  });
});

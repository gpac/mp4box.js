import { createFile, MP4BoxBuffer } from '../entries/all';

function box(type: string, payload: Uint8Array, size = payload.length + 8) {
  const out = new Uint8Array(payload.length + 8);
  new DataView(out.buffer).setUint32(0, size);
  out.set(new TextEncoder().encode(type), 4);
  out.set(payload, 8);
  return out;
}

function parse(parts: Array<Uint8Array>) {
  const file = createFile();
  const errors: Array<string> = [];
  file.onError = (_module, message) => errors.push(message);
  let offset = 0;
  for (const part of parts) {
    const ab = part.slice().buffer;
    file.appendBuffer(MP4BoxBuffer.fromArrayBuffer(ab, offset));
    offset += part.length;
  }
  file.flush();
  return errors;
}

describe('Interrupted recording', () => {
  it('reports an error on flush when there is media data but no moov', () => {
    const ftyp = box('ftyp', new TextEncoder().encode('isom\0\0\0\0isom'));
    // mdat header claims more data than the file holds, and no moov follows: the recording was cut off
    const mdat = box('mdat', new Uint8Array(5000).fill(7), 1_000_000);
    const errors = parse([ftyp, mdat]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('No moov box found');
  });
});

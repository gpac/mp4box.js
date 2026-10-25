import { DataStream, Endianness } from '../entries/all';

function streamOf(...bytes: Array<number>) {
  return new DataStream(new Uint8Array(bytes).buffer);
}

function bytesOf(stream: DataStream) {
  return Array.from(new Uint8Array(stream.buffer));
}

describe('DataStream bit mode', () => {
  describe('reading', () => {
    it('reads fields spanning byte boundaries', () => {
      // 101 1100110 011010 01 -> 3 + 7 + 6 bits, then 2 bits of zero padding
      const stream = streamOf(0b10111001, 0b10011010, 0b00000000);
      stream.enterBitMode();
      expect(stream.readBits(3)).toBe(0b101);
      expect(stream.readBits(7)).toBe(0b1100110);
      expect(stream.readBits(6)).toBe(0b011010);
      expect(stream.getPosition()).toBe(2);
      expect(stream.readFlag()).toBe(false);
      stream.exitBitMode();
      expect(stream.getPosition()).toBe(3);
    });

    it('reads unaligned scalars through the regular methods', () => {
      const stream = streamOf(0xab, 0xcd, 0xff, 0xff, 0xff, 0xff, 0xe0);
      stream.enterBitMode();
      expect(stream.readBits(4)).toBe(0b1010);
      expect(stream.readUint16()).toBe(0xbcdf);
      expect(stream.readInt32()).toBe(-2);
      stream.exitBitMode();
      expect(stream.getPosition()).toBe(7);
    });

    it('keeps 32-bit values unsigned', () => {
      const stream = streamOf(0x0f, 0xff, 0xff, 0xff, 0xf0);
      stream.enterBitMode();
      stream.readBits(4);
      expect(stream.readBits(32)).toBe(0xffffffff);
      stream.exitBitMode();
    });

    it('sign-extends unaligned signed integers', () => {
      const stream = streamOf(0x0f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xe0);
      stream.enterBitMode();
      stream.readBits(4);
      expect(stream.readInt8()).toBe(-1);
      expect(stream.readInt16()).toBe(-1);
      expect(stream.readInt32()).toBe(-2);
      stream.exitBitMode();
    });

    it('peeks without moving', () => {
      const stream = streamOf(0b1011_0110, 0b0100_0000);
      stream.enterBitMode();
      stream.readBits(3);
      expect(stream.peekBits(7)).toBe(0b1011001);
      expect(stream.getPosition()).toBe(0);
      expect(stream.readBits(7)).toBe(0b1011001);
      expect(stream.getPosition()).toBe(1);
      stream.exitBitMode();
    });
  });

  describe('exiting', () => {
    it('throws on non-zero padding', () => {
      const stream = streamOf(0b1000_0001);
      stream.enterBitMode();
      stream.readBits(4);
      expect(() => stream.exitBitMode()).toThrow(/Padding/);
      // The stream is still realigned and out of bit mode
      expect(stream.inBitMode).toBe(false);
      expect(stream.getPosition()).toBe(1);
    });

    it('does not advance when already aligned', () => {
      const stream = streamOf(0xff, 0x00);
      stream.enterBitMode();
      stream.readBits(8);
      stream.exitBitMode();
      expect(stream.getPosition()).toBe(1);
    });

    it('only realigns when leaving the outermost bit mode', () => {
      const stream = streamOf(0b1011_1010, 0b0000_0000);
      stream.enterBitMode();
      expect(stream.readBits(3)).toBe(0b101);
      stream.enterBitMode();
      expect(stream.readBits(4)).toBe(0b1101);
      stream.exitBitMode();
      expect(stream.inBitMode).toBe(true);
      expect(stream.readFlag()).toBe(false);
      expect(stream.readBits(2)).toBe(0);
      stream.exitBitMode();
      expect(stream.inBitMode).toBe(false);
      expect(stream.getPosition()).toBe(2);
    });
  });

  describe('errors', () => {
    it('requires bit mode for bit access', () => {
      const stream = streamOf(0);
      expect(() => stream.readBits(1)).toThrow(/enterBitMode/);
      expect(() => stream.peekBits(1)).toThrow(/enterBitMode/);
      expect(() => stream.writeBits(1, 1)).toThrow(/enterBitMode/);
      expect(() => stream.exitBitMode()).toThrow(/Not in bit mode/);
    });

    it('rejects unsupported bit counts', () => {
      const stream = streamOf(0, 0, 0, 0, 0);
      stream.enterBitMode();
      expect(() => stream.readBits(33)).toThrow(/Unsupported/);
      expect(() => stream.readBits(-1)).toThrow(/Unsupported/);
    });

    it('rejects byte-only operations when not byte aligned', () => {
      const stream = streamOf(0, 0x41, 0x42, 0, 0);
      stream.enterBitMode();
      stream.readBits(1);
      expect(() => stream.readCString()).toThrow(/aligned/);
      expect(() => stream.readUint8Array(2)).toThrow(/aligned/);
      expect(() => stream.seek(0)).toThrow(/aligned/);
      expect(() => stream.readUint16(Endianness.LITTLE_ENDIAN)).toThrow(/Little-endian/);
    });

    it('reads unaligned strings', () => {
      // 'mif1' and 'av1C' shifted by 3 bits, then 5 bits of padding
      const shifted = (text: string) => {
        let bits = '101';
        for (const c of text) bits += c.charCodeAt(0).toString(2).padStart(8, '0');
        bits = bits.padEnd(Math.ceil(bits.length / 8) * 8, '0');
        return (bits.match(/.{8}/g) ?? []).map(b => parseInt(b, 2));
      };
      const stream = streamOf(...shifted('mif1av1C'));
      stream.enterBitMode();
      expect(stream.readBits(3)).toBe(0b101);
      expect(stream.readString(4)).toBe('mif1');
      expect(stream.readString(4, 'UTF-8')).toBe('av1C');
      stream.exitBitMode();
      expect(stream.getPosition()).toBe(9);
    });

    it('allows byte-only operations in bit mode when aligned', () => {
      const stream = streamOf(0xf0, 0x41, 0x42, 0);
      stream.enterBitMode();
      stream.readBits(8);
      expect(stream.readCString()).toBe('AB');
      stream.exitBitMode();
    });
  });

  describe('writing', () => {
    it('writes bits and unaligned scalars', () => {
      const stream = new DataStream();
      stream.enterBitMode();
      stream.writeBits(0b101, 3);
      stream.writeUint16(0xabcd);
      stream.writeFlag(true);
      stream.writeInt8(-1);
      stream.exitBitMode();
      // 101 1010101111001101 1 11111111 + 4 bits of padding
      expect(bytesOf(stream)).toEqual([0b1011_0101, 0b0111_1001, 0b1011_1111, 0b1111_0000]);

      stream.seek(0);
      stream.enterBitMode();
      expect(stream.readBits(3)).toBe(0b101);
      expect(stream.readUint16()).toBe(0xabcd);
      expect(stream.readFlag()).toBe(true);
      expect(stream.readInt8()).toBe(-1);
      stream.exitBitMode();
      expect(stream.getPosition()).toBe(4);
    });

    it('writes 32-bit values', () => {
      const stream = new DataStream();
      stream.enterBitMode();
      stream.writeBits(0, 4);
      stream.writeBits(0xffffffff, 32);
      stream.writeInt32(-2);
      stream.exitBitMode();
      expect(bytesOf(stream)).toEqual([0x0f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xe0]);
    });

    it('overwrites stale bytes', () => {
      const stream = streamOf(0xff, 0xff);
      stream.enterBitMode();
      stream.writeBits(0b1, 1);
      stream.exitBitMode();
      expect(bytesOf(stream)).toEqual([0b1000_0000, 0xff]);
    });

    it('supports a length prefix written after the bit fields', () => {
      const stream = new DataStream();
      const lengthPosition = stream.getPosition();
      stream.writeUint8(0);
      stream.enterBitMode();
      stream.writeBits(0b11, 2);
      stream.writeUint16(0x1234);
      stream.exitBitMode();
      stream.adjustUint8(lengthPosition, stream.getPosition() - lengthPosition - 1);
      expect(bytesOf(stream)).toEqual([3, 0b1100_0100, 0b1000_1101, 0]);
    });
  });
});

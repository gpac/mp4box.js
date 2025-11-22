/*
 * Copyright (c) 2023. Paul Higgs
 * License: BSD-3-Clause (see LICENSE file)
 *
 *
 * reads bits and bytes from a buffer that may not contain aligned values
 * TODO: add writing support
 */

import { Endianness } from '#/DataStream';

class State {
  rbyte: number;
  rbit: number;
  wbyte: number;
  wbit: number;
  end: number;
  read_error: boolean;
  write_error: boolean;

  constructor() {
    this.rbyte = this.rbit = this.rbyte = this.rbit = this.end - 0;
    this.read_error = this.write_error = false;
  }
}

export class BitBuffer {
  private endianness: Endianness;
  private _buffer: Array<number>;
  private _state: State;
  private _big_endian = true; // results are returned Big Endian

  constructor(stream?: Uint8Array, endianness?: Endianness) {
    this._state = new State();
    this.load(stream ? stream : new Uint8Array([]));
    this.endianness = endianness ? endianness : this._ENDIANNESS();
  }

  load(stream: Uint8Array): void {
    this._buffer = [...stream];
    this._state.rbit = this._state.rbyte = 0;
    this._state.wbit = 0;
    this._state.wbyte = this._state.end = this._buffer.length;
    this._state.read_error = this._state.write_error = false;
  }

  appendUint8(byte: number): void {
    this._buffer.push(byte);
    this._state.end = this._state.wbyte = this._buffer.length;
  }

  extend(bits: number): void {
    let count = bits;
    while (count > 0) {
      this._buffer.push(0);
      count -= 8;
    }
  }

  getBit(): number {
    //! Read the next bit and advance the read pointer.
    if (this._state.read_error || this.endOfRead()) {
      this._state.read_error = true;
      return 0;
    }
    const bit: number =
      (this._buffer[this._state.rbyte] >>
        (this._big_endian ? 7 - this._state.rbit : this._state.rbit)) &
      0x01;
    if (++this._state.rbit > 7) {
      this._state.rbyte++;
      this._state.rbit = 0;
    }
    return bit;
  }

  peekBit(): number {
    //! Read the next bit and but dont advance the read pointer.
    if (this._state.read_error || this.endOfRead()) {
      this._state.read_error = true;
      return 0;
    }
    const bit: number =
      (this._buffer[this._state.rbyte] >>
        (this._big_endian ? 7 - this._state.rbit : this._state.rbit)) &
      0x01;
    return bit;
  }

  endOfRead(): boolean {
    return this._state.rbyte === this._state.wbyte && this._state.rbit === this._state.wbit;
  }

  getBool(): boolean {
    return this.getBit() !== 0;
  }

  private _rdb(bytes: number): number {
    let i: number, res: number;
    // eslint-disable-next-line no-loss-of-precision
    const ff = 0xffffffffffffffff;
    if (this._state.read_error) return ff;
    if (this._state.rbit === 0) {
      // Read buffer is byte aligned. Most common case.
      if (this._state.rbyte + bytes > this._state.wbyte) {
        // Not enough bytes to read.
        this._state.read_error = true;
        return ff;
      } else {
        for (res = 0, i = 0; i < bytes; i++) res = (res << 8) + this._buffer[this._state.rbyte + i];
        this._state.rbyte += bytes;
        return res;
      }
    } else {
      // Read buffer is not byte aligned, use an intermediate aligned buffer.
      if (this.currentReadBitOffset() + 8 * bytes > this.currentWriteBitOffset()) {
        // Not enough bytes to read.
        this._state.read_error = true;
        return ff;
      } else {
        for (res = 0, i = 0; i < bytes; i++) {
          if (this._big_endian)
            res =
              (res << 8) +
              ((this._buffer[this._state.rbyte] << this._state.rbit) |
                (this._buffer[this._state.rbyte + 1] >> (8 - this._state.rbit)));
          else
            res =
              (res << 8) +
              ((this._buffer[this._state.rbyte] >> this._state.rbit) |
                (this._buffer[this._state.rbyte + 1] << (8 - this._state.rbit)));
          this._state.rbyte++;
        }
        return res;
      }
    }
    return ff; // we should never get here!!
  }

  getUint8() {
    return this._rdb(1);
  }

  getUint16() {
    return this._big_endian ? this._GetUInt16BE(this._rdb(2)) : this._GetUInt16LE(this._rdb(2));
  }
  private _ByteSwap16 = function (x) {
    return (x << 8) | (x >> 8);
  };
  private _CondByteSwap16BE = function (val: number) {
    return this._OSisLittleEndian() ? this._ByteSwap16(val) : val;
  };
  private _CondByteSwap16LE = function (val: number) {
    return this._OSisLittleEndian() ? val : this._ByteSwap16(val);
  };
  private _GetUInt16BE = function (val: number) {
    return this._CondByteSwap16BE(val);
  };
  private _GetUInt16LE = function (val: number) {
    return this._CondByteSwap16LE(val);
  };

  getUint24() {
    return this._big_endian ? this._GetUInt24BE(this._rdb(3)) : this._GetUInt24LE(this._rdb(3));
  }

  private _ByteSwap24 = function (x: number) {
    return ((x & 0xff0000) >> 16) | (x & 0xff00) | (x & (0xff << 16));
  };
  private _CondByteSwap24BE = function (val: number) {
    return this._OSisLittleEndian() ? this._ByteSwap24(val) : val;
  };
  private _CondByteSwap24LE = function (val: number) {
    return this._OSisLittleEndian() ? val : this._ByteSwap24(val);
  };
  private _GetUInt24BE = function (val: number) {
    return this._CondByteSwap24BE(val);
  };
  private _GetUInt24LE = function (val: number) {
    return this._CondByteSwap24LE(val);
  };

  getUint32() {
    return this._big_endian ? this._GetUInt32BE(this._rdb(4)) : this._GetUInt32LE(this._rdb(4));
  }

  private _ByteSwap32(x: number) {
    return (x << 24) | ((x << 8) & 0x00ff0000) | ((x >> 8) & 0x0000ff00) | (x >> 24);
  }
  private _CondByteSwap32BE(val: number) {
    return this._OSisLittleEndian() ? this._ByteSwap32(val) : val;
  }
  private _CondByteSwap32LE(val: number) {
    return this._OSisLittleEndian() ? val : this._ByteSwap32(val);
  }
  private _GetUInt32BE(val: number) {
    return this._CondByteSwap32BE(val);
  }
  private _GetUInt32LE(val: number) {
    return this._CondByteSwap32LE(val);
  }

  getBits(bits: number): number {
    // No read if read error is already set or not enough bits to read.
    if (
      this._state.read_error ||
      this.currentReadBitOffset() + bits > this.currentWriteBitOffset()
    ) {
      this._state.read_error = true;
      return 0;
    }
    let val = 0;
    if (this._big_endian) {
      // Read leading bits up to byte boundary
      while (bits > 0 && this._state.rbit !== 0) {
        val = (val << 1) | this.getBit();
        --bits;
      }

      // Read complete bytes
      while (bits > 7) {
        val = (val << 8) | this._buffer[this._state.rbyte++];
        bits -= 8;
      }

      // Read trailing bits
      while (bits > 0) {
        val = (val << 1) | this.getBit();
        --bits;
      }
    } else {
      // Little endian decoding
      let shift = 0;

      // Read leading bits up to byte boundary
      while (bits > 0 && this._state.rbit !== 0) {
        val |= this.getBit() << shift;
        --bits;
        shift++;
      }

      // Read complete bytes
      while (bits > 7) {
        val |= this._buffer[this._state.rbyte++] << shift;
        bits -= 8;
        shift += 8;
      }

      // Read trailing bits
      while (bits > 0) {
        val |= this.getBit() << shift;
        --bits;
        shift++;
      }
    }
    return val;
  }

  skipBits(bits: number): boolean {
    if (this._state.read_error) {
      // Can't skip bits and bytes if read error is already set.
      return false;
    }
    const rpos = 8 * this._state.rbyte + this._state.rbit + bits;
    const wpos = 8 * this._state.wbyte + this._state.wbit;
    if (rpos > wpos) {
      this._state.rbyte = this._state.wbyte;
      this._state.rbit = this._state.wbit;
      this._state.read_error = true;
      return false;
    }
    this._state.rbyte = rpos >> 3;
    this._state.rbit = rpos & 7;
    return true;
  }

  skipBit(): boolean {
    return this.skipBits(1);
  }

  getUE(): number {
    // read in an unsigned Exp-Golomb code;
    if (this.getBit() === 1) return 0;
    let zero_count = 1;
    while (this.peekBit() === 0) {
      this.getBit();
      zero_count++;
    }
    return this.getBits(zero_count + 1) - 1;
  }

  byte_alignment(): void {
    while (!this._state.read_error && this._state.rbit !== 0) this.skipBit();
  }

  private _OSisLittleEndian(): boolean {
    return this.endianness === Endianness.LITTLE_ENDIAN;
  }

  private _ENDIANNESS(): Endianness {
    const buf = new ArrayBuffer(4);
    const u32data = new Uint32Array(buf);
    const u8data = new Uint8Array(buf);
    u32data[0] = 0xcafebabe;
    return u8data[3] === 0xca ? Endianness.BIG_ENDIAN : Endianness.LITTLE_ENDIAN;
  }

  currentReadByteOffset(): number {
    return this._state.rbyte;
  }
  currentReadBitOffset(): number {
    return 8 * this._state.rbyte + this._state.rbit;
  }
  currentWriteByteOffset(): number {
    return this._state.wbyte;
  }
  currentWriteBitOffset(): number {
    return 8 * this._state.wbyte + this._state.wbit;
  }
  bitsRemaining() {
    return this.currentWriteBitOffset() - this.currentReadBitOffset();
  }
  writeBitsRemaining(): number {
    return 8 * this._buffer.length - this.currentWriteBitOffset();
  }
  /*
  TODO - for near future implementation to support writing AVS3 related boxes that are not byte aligned
  writeBit(bit: number): void {
    if (this.writeBitsRemaining() < 1)
      this.extend(1);
  }
 */
}

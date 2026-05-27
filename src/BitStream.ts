/*
 * Copyright (c) 2026. Paul Higgs
 * License: BSD-3-Clause (see LICENSE file)
 *
 *
 * reads bits and bytes from a buffer that may not contain aligned values
 * TODO: add writing support
 */

import { DataStream, Endianness } from '#/DataStream';
import type { MultiBufferStream } from './buffer';

class State {
  rbyte: number;
  rbit: number;
  wbyte: number;
  wbit: number;
  end: number;
  read_error: boolean;
  write_error: boolean;

  constructor() {
    this.rbyte = this.rbit = this.wbyte = this.wbit = this.end = 0;
    this.read_error = this.write_error = false;
  }

  readBitOffset(): number {
    return 8 * this.rbyte + this.rbit;
  }
  readByteOffset() {
    return this.rbyte;
  }
  writeBitOffset(): number {
    return 8 * this.wbyte + this.wbit;
  }
  writeByteOffset() {
    return this.wbyte;
  }
  aligned() {
    return this.read_error && this.rbit !== 0;
  }
}

export class BitStream {
  private buffer: Array<number>;
  private stream: MultiBufferStream | DataStream;
  private state: State;
  private endianness: Endianness;

  constructor(stream: MultiBufferStream | DataStream, endianness?: Endianness) {
    this.state = new State();
    this.stream = stream;
    this.endianness = endianness ? endianness : Endianness.BIG_ENDIAN;
  }

  appendUint8(count = 1): void {
    for (let i = 0; i < count; i++) this.buffer.push(this.stream.readUint8());
    this.state.end = this.state.wbyte = this.buffer.length;
  }

  extend(bits: number): void {
    let count = bits;
    while (count > 0) {
      this.buffer.push(0);
      count -= 8;
    }
  }

  readBit(): number {
    //! Read the next bit and advance the read pointer.
    if (this.state.read_error || this.endOfRead()) {
      this.state.read_error = true;
      return 0;
    }
    const bit: number =
      (this.buffer[this.state.rbyte] >>
        (this.endianness === Endianness.BIG_ENDIAN ? 7 - this.state.rbit : this.state.rbit)) &
      0x01;
    if (++this.state.rbit > 7) {
      this.state.rbyte++;
      this.state.rbit = 0;
    }
    return bit;
  }

  peekBit(): number {
    //! Read the next bit and but dont advance the read pointer.
    if (this.state.read_error || this.endOfRead()) {
      this.state.read_error = true;
      return 0;
    }
    const bit: number =
      (this.buffer[this.state.rbyte] >>
        (this.endianness === Endianness.BIG_ENDIAN ? 7 - this.state.rbit : this.state.rbit)) &
      0x01;
    return bit;
  }

  endOfRead(): boolean {
    return this.state.rbyte === this.state.wbyte && this.state.rbit === this.state.wbit;
  }

  getBool(): boolean {
    return this.readBit() !== 0;
  }

  private rdb = function (bytes: number): number {
    let i: number, res: number;
    // eslint-disable-next-line no-loss-of-precision
    const ff = 0xffffffffffffffff;
    if (this.state.read_error) return ff;
    if (this.state.rbit === 0) {
      // Read buffer is byte aligned. Most common case.
      if (this.state.rbyte + bytes > this.state.wbyte) {
        // Not enough bytes to read.
        this.state.read_error = true;
        return ff;
      } else {
        for (res = 0, i = 0; i < bytes; i++) res = (res << 8) + this.buffer[this.state.rbyte + i];
        this.state.rbyte += bytes;
        return res;
      }
    } else {
      // Read buffer is not byte aligned, use an intermediate aligned buffer.
      if (this.currentReadBitOffset() + 8 * bytes > this.currentWriteBitOffset()) {
        // Not enough bytes to read.
        this.state.read_error = true;
        return ff;
      } else {
        for (res = 0, i = 0; i < bytes; i++) {
          if (this.endianness === Endianness.BIG_ENDIAN)
            res =
              (res << 8) +
              ((this.buffer[this.state.rbyte] << this.state.rbit) |
                (this.buffer[this.state.rbyte + 1] >> (8 - this.state.rbit)));
          else
            res =
              (res << 8) +
              ((this.buffer[this.state.rbyte] >> this.state.rbit) |
                (this.buffer[this.state.rbyte + 1] << (8 - this.state.rbit)));
          this.state.rbyte++;
        }
        return res;
      }
    }
    return ff; // we should never get here!!
  };

  readUint8() {
    return this.rdb(1);
  }

  readUint16(endianness?: Endianness) {
    return (endianness ?? this.endianness) === Endianness.BIG_ENDIAN
      ? this.GetUInt16BE(this.rdb(2))
      : this.GetUInt16LE(this.rdb(2));
  }
  private GetUInt16BE = function (val: number) {
    return this.OSisLittleEndian() ? this.ByteSwap16(val) : val;
  };
  private GetUInt16LE = function (val: number) {
    return this.OSisLittleEndian() ? val : this.ByteSwap16(val);
  };
  private ByteSwap16 = function (x: number): number {
    return (x << 8) | (x >> 8);
  };

  readUint24(endianness?: Endianness) {
    return (endianness ?? this.endianness) === Endianness.BIG_ENDIAN
      ? this.GetUInt24BE(this.rdb(3))
      : this.GetUInt24LE(this.rdb(3));
  }

  private ByteSwap24 = function (x: number) {
    return ((x & 0xff0000) >> 16) | (x & 0xff00) | (x & (0xff << 16));
  };
  private GetUInt24BE = function (val: number) {
    return this.OSisLittleEndian() ? this.ByteSwap24(val) : val;
  };
  private GetUInt24LE = function (val: number) {
    return this.OSisLittleEndian() ? val : this.ByteSwap24(val);
  };

  readUint32(endianness?: Endianness) {
    return (endianness ?? this.endianness) === Endianness.BIG_ENDIAN
      ? this.GetUInt32BE(this.rdb(4))
      : this.GetUInt32LE(this.rdb(4));
  }
  private ByteSwap32 = function (x: number) {
    return (x << 24) | ((x << 8) & 0x00ff0000) | ((x >> 8) & 0x0000ff00) | (x >> 24);
  };
  private GetUInt32BE = function (val: number) {
    return this.OSisLittleEndian() ? this.ByteSwap32(val) : val;
  };
  private GetUInt32LE = function (val: number) {
    return this.OSisLittleEndian() ? val : this.ByteSwap32(val);
  };

  readBits(bits: number): number {
    // No read if read error is already set or not enough bits to read.
    if (
      this.state.read_error ||
      this.currentReadBitOffset() + bits > this.currentWriteBitOffset()
    ) {
      this.state.read_error = true;
      return 0;
    }
    let val = 0;
    if (this.endianness === Endianness.BIG_ENDIAN) {
      // Read leading bits up to byte boundary
      while (bits > 0 && this.state.rbit !== 0) {
        val = (val << 1) | this.readBit();
        --bits;
      }

      // Read complete bytes
      while (bits > 7) {
        val = (val << 8) | this.buffer[this.state.rbyte++];
        bits -= 8;
      }

      // Read trailing bits
      while (bits > 0) {
        val = (val << 1) | this.readBit();
        --bits;
      }
    } else {
      // Little endian decoding
      let shift = 0;

      // Read leading bits up to byte boundary
      while (bits > 0 && this.state.rbit !== 0) {
        val |= this.readBit() << shift;
        --bits;
        shift++;
      }

      // Read complete bytes
      while (bits > 7) {
        val |= this.buffer[this.state.rbyte++] << shift;
        bits -= 8;
        shift += 8;
      }

      // Read trailing bits
      while (bits > 0) {
        val |= this.readBit() << shift;
        --bits;
        shift++;
      }
    }
    return val;
  }

  skipBits(bits: number): boolean {
    if (this.state.read_error) {
      // Can't skip bits and bytes if read error is already set.
      return false;
    }
    const rpos = 8 * this.state.rbyte + this.state.rbit + bits;
    const wpos = 8 * this.state.wbyte + this.state.wbit;
    if (rpos > wpos) {
      this.state.rbyte = this.state.wbyte;
      this.state.rbit = this.state.wbit;
      this.state.read_error = true;
      return false;
    }
    this.state.rbyte = rpos >> 3;
    this.state.rbit = rpos & 7;
    return true;
  }

  skipBit(): boolean {
    return this.skipBits(1);
  }

  readUE(): number {
    // read in an Unsigned Exp-Golomb code;
    if (this.readBit() === 1) return 0;
    let zero_count = 1;
    while (this.peekBit() === 0) {
      this.readBit();
      zero_count++;
    }
    return this.readBits(zero_count + 1) - 1;
  }

  byte_alignment(): void {
    while (!this.state.aligned) this.skipBit();
  }

  private OSisLittleEndian = function (): boolean {
    return this.stream.endianness === Endianness.LITTLE_ENDIAN;
  };

  currentReadByteOffset(): number {
    return this.state.readByteOffset();
  }
  currentReadBitOffset(): number {
    return this.state.readBitOffset();
  }
  currentWriteByteOffset(): number {
    return this.state.writeByteOffset();
  }
  currentWriteBitOffset(): number {
    return this.state.writeBitOffset();
  }
  bitsRemaining(): number {
    return this.currentWriteBitOffset() - this.currentReadBitOffset();
  }
  writeBitsRemaining(): number {
    return 8 * this.buffer.length - this.currentWriteBitOffset();
  }
  /*
  TODO - for near future implementation to support writing AVS3 related boxes that are not byte aligned
  writeBit(bit: number): void {
    if (this.writeBitsRemaining() < 1)
      this.extend(1);
  }
 */
}

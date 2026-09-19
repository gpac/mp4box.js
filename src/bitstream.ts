import type { MultiBufferStream } from '#/buffer';

/**
 * BitStream is a class that acts as a MultiBufferStream wrapper for parsing individual bits
 */
export class BitStream {
  // The last byte read from the stream.
  last_byte: number;
  // If not zero, number of most significant bits already read in last_byte.
  num_bits_read_in_last_byte: number;

  constructor(readonly stream: MultiBufferStream) {
    this.last_byte = 0;
    this.num_bits_read_in_last_byte = 0;
  }

  /**
   * Reads bits with or without byte alignment and potentially across multiple bytes.
   * The bits are read in the earliest byte first, and most significant bits in a byte first.
   * @param num_bits Number of bits to read.
   * @return An unsigned integer whose binary representation is the big-endian read bits.
   */
  read(num_bits: number) {
    if (num_bits > 32) {
      throw new Error('BitStream.read: Unsupported number of bits.');
    }
    let remaining_num_bits = num_bits;
    let value = 0;
    while (remaining_num_bits !== 0) {
      if (this.num_bits_read_in_last_byte === 0) {
        this.last_byte = this.stream.readUint8();
      }
      // Number of bits among remaining_num_bits that can be read in the last_byte.
      const num_read_bits = Math.min(8 - this.num_bits_read_in_last_byte, remaining_num_bits);
      // Read the most significant bits first.
      const read_bits =
        (this.last_byte >> (8 - this.num_bits_read_in_last_byte - num_read_bits)) &
        ((1 << num_read_bits) - 1);
      value = (value << num_read_bits) | read_bits;
      this.num_bits_read_in_last_byte = (this.num_bits_read_in_last_byte + num_read_bits) % 8;
      remaining_num_bits -= num_read_bits;
    }
    return value;
  }

  /**
   * Reads one bit.
   * @return The read bit.
   */
  bool() {
    return this.read(1) === 1;
  }

  /**
   * Reads a potentially unaligned four-character code.
   * @return The read big-endian 4CC.
   */
  four_cc() {
    return String.fromCharCode(this.read(8), this.read(8), this.read(8), this.read(8));
  }

  /**
   * Reads up to seven bits until byte alignment. The read bits must be zeros.
   */
  pad_with_zeros() {
    if (
      this.num_bits_read_in_last_byte !== 0 &&
      this.read(8 - this.num_bits_read_in_last_byte) !== 0
    ) {
      throw new Error('BitStream.padding: Bits were not all set to zero.');
    }
  }

  /**
   * Reads a potentially unaligned 8-bit unsigned int from the underlying MultiBufferStream.
   * @return The read big-endian number.
   */
  readUint8() {
    return this.read(8);
  }

  /**
   * Reads a potentially unaligned 16-bit unsigned int from the underlying MultiBufferStream.
   * @return The read big-endian number.
   */
  readUint16() {
    return this.read(16);
  }

  /**
   * Reads a potentially unaligned 32-bit unsigned int from the underlying MultiBufferStream.
   * @return The read big-endian number.
   */
  readUint32() {
    return this.read(32);
  }

  /**
   * Reads a potentially unaligned 32-bit signed int from the underlying MultiBufferStream.
   * @return The read big-endian number.
   */
  readInt32() {
    return this.read(1) ? this.read(31) - Math.pow(2, 31) : this.read(31);
  }
}

import { MAX_SIZE } from '#/constants';
import type { MP4BoxBuffer, StructDefinition, StructType, TypedArray } from '#/types';

/* 
  TODO: fix endianness for 24/64-bit fields
  TODO: check range/support for 64-bits numbers in JavaScript
*/

export class DataStream {
  static DataStream: {};

  _buffer?: MP4BoxBuffer;
  _byteOffset?: number;
  _dataView?: DataView;

  endianness: boolean;
  position: number;

  /**
   * DataStream reads scalars, arrays and structs of data from an ArrayBuffer.
   * It's like a file-like DataView on steroids.
   *
   * @param arrayBuffer ArrayBuffer to read from.
   * @param byteOffset Offset from arrayBuffer beginning for the DataStream.
   * @param endianness DataStream.BIG_ENDIAN or DataStream.LITTLE_ENDIAN (the default).
   */
  constructor(
    arrayBuffer?: ArrayBuffer | DataView | number,
    byteOffset?: number,
    endianness?: boolean | null,
  ) {
    this._byteOffset = byteOffset || 0;
    if (arrayBuffer instanceof ArrayBuffer) {
      this.buffer = arrayBuffer;
    } else if (typeof arrayBuffer == 'object') {
      this.dataView = arrayBuffer;
      if (byteOffset) {
        this._byteOffset += byteOffset;
      }
    } else {
      this.buffer = new ArrayBuffer(arrayBuffer || 0);
    }
    this.position = 0;
    this.endianness = endianness == null ? DataStream.LITTLE_ENDIAN : endianness;
  }

  getPosition() {
    return this.position;
  }

  /**
   * Internal function to resize the DataStream buffer when required.
   * @param extra Number of bytes to add to the buffer allocation.
   */
  _realloc(extra: number) {
    if (!this._dynamicSize) {
      return;
    }
    const req = this._byteOffset + this.position + extra;
    let blen = this._buffer.byteLength;
    if (req <= blen) {
      if (req > this._byteLength) {
        this._byteLength = req;
      }
      return;
    }
    if (blen < 1) {
      blen = 1;
    }
    while (req > blen) {
      blen *= 2;
    }
    const buf = new ArrayBuffer(blen);
    const src = new Uint8Array(this._buffer);
    const dst = new Uint8Array(buf, 0, src.length);
    dst.set(src);
    this.buffer = buf;
    this._byteLength = req;
  }

  /**
   * Internal function to trim the DataStream buffer when required.
   * Used for stripping out the extra bytes from the backing buffer when
   * the virtual byteLength is smaller than the buffer byteLength (happens after
   * growing the buffer with writes and not filling the extra space completely).
   */
  _trimAlloc() {
    if (this._byteLength == this._buffer.byteLength) {
      return;
    }
    const buf = new ArrayBuffer(this._byteLength);
    const dst = new Uint8Array(buf);
    const src = new Uint8Array(this._buffer, 0, dst.length);
    dst.set(src);
    this.buffer = buf;
  }

  /**
   * Big-endian const to use as default endianness.
   */
  static BIG_ENDIAN = false;

  /**
   * Little-endian const to use as default endianness.
   */
  static LITTLE_ENDIAN = true;

  /**
   * Virtual byte length of the DataStream backing buffer.
   * Updated to be max of original buffer size and last written size.
   * If dynamicSize is false is set to buffer size.
   */
  _byteLength = 0;

  /**
   * Returns the byte length of the DataStream object.
   * @type {number}
   */
  get byteLength() {
    return this._byteLength - this._byteOffset;
  }

  /**
   * Set/get the backing ArrayBuffer of the DataStream object.
   * The setter updates the DataView to point to the new buffer.
   * @type {Object}
   */

  get buffer() {
    this._trimAlloc();
    return this._buffer;
  }
  set buffer(value) {
    this._buffer = value;
    this._dataView = new DataView(this._buffer, this._byteOffset);
    this._byteLength = this._buffer.byteLength;
  }

  /**
   * Set/get the byteOffset of the DataStream object.
   * The setter updates the DataView to point to the new byteOffset.
   * @type {number}
   */
  get byteOffset() {
    return this._byteOffset;
  }
  set byteOffset(value) {
    this._byteOffset = value;
    this._dataView = new DataView(this._buffer, this._byteOffset);
    this._byteLength = this._buffer.byteLength;
  }

  /**
   * Set/get the byteOffset of the DataStream object.
   * The setter updates the DataView to point to the new byteOffset.
   * @type {number}
   */
  get dataView() {
    return this._dataView;
  }
  set dataView(value) {
    this._byteOffset = value.byteOffset;
    this._buffer = value.buffer;
    this._dataView = new DataView(this._buffer, this._byteOffset);
    this._byteLength = this._byteOffset + value.byteLength;
  }

  /**
   *   Sets the DataStream read/write position to given position.
   *   Clamps between 0 and DataStream length.
   *
   *   @param pos Position to seek to.
   *   @return
   */
  seek(pos: number) {
    const npos = Math.max(0, Math.min(this.byteLength, pos));
    this.position = isNaN(npos) || !isFinite(npos) ? 0 : npos;
  }

  /**
   * Returns true if the DataStream seek pointer is at the end of buffer and
   * there's no more data to read.
   *
   * @return True if the seek pointer is at the end of the buffer.
   */
  isEof() {
    return this.position >= this._byteLength;
  }

  /**
   * Maps a Uint8Array into the DataStream buffer.
   *
   * Nice for quickly reading in data.
   *
   * @param length Number of elements to map.
   * @param e Endianness of the data to read.
   * @return Uint8Array to the DataStream backing buffer.
   */
  mapUint8Array(length: number) {
    this._realloc(length * 1);
    const arr = new Uint8Array(this._buffer, this.byteOffset + this.position, length);
    this.position += length * 1;
    return arr;
  }

  /**
   * Reads an Int32Array of desired length and endianness from the DataStream.
   *
   * @param length Number of elements to map.
   * @param endianness Endianness of the data to read.
   * @return The read Int32Array.
   */
  readInt32Array(length: number | null, endianness?: boolean | null) {
    length = length == null ? this.byteLength - this.position / 4 : length;
    const arr = new Int32Array(length);
    DataStream.memcpy(
      arr.buffer,
      0,
      this.buffer,
      this.byteOffset + this.position,
      length * arr.BYTES_PER_ELEMENT,
    );
    DataStream.arrayToNative(arr, endianness == null ? this.endianness : endianness);
    this.position += arr.byteLength;
    return arr;
  }

  /**
   * Reads an Int16Array of desired length and endianness from the DataStream.
   *
   * @param length Number of elements to map.
   * @param endianness Endianness of the data to read.
   * @return The read Int16Array.
   */
  readInt16Array(length: number | null, endianness?: boolean) {
    length = length == null ? this.byteLength - this.position / 2 : length;
    const arr = new Int16Array(length);
    DataStream.memcpy(
      arr.buffer,
      0,
      this.buffer,
      this.byteOffset + this.position,
      length * arr.BYTES_PER_ELEMENT,
    );
    DataStream.arrayToNative(arr, endianness == null ? this.endianness : endianness);
    this.position += arr.byteLength;
    return arr;
  }

  /**
   * Reads an Int8Array of desired length from the DataStream.
   *
   * @param length Number of elements to map.
   * @param e Endianness of the data to read.
   * @return The read Int8Array.
   */
  readInt8Array(length: number | null) {
    length = length == null ? this.byteLength - this.position : length;
    const arr = new Int8Array(length);
    DataStream.memcpy(
      arr.buffer,
      0,
      this.buffer,
      this.byteOffset + this.position,
      length * arr.BYTES_PER_ELEMENT,
    );
    this.position += arr.byteLength;
    return arr;
  }

  /**
   * Reads a Uint32Array of desired length and endianness from the DataStream.
   *
   *  @param length Number of elements to map.
   *  @param endianness Endianness of the data to read.
   *  @return The read Uint32Array.
   */
  readUint32Array(length: number | null, endianness?: boolean | null) {
    length = length == null ? this.byteLength - this.position / 4 : length;
    const arr = new Uint32Array(length);
    DataStream.memcpy(
      arr.buffer,
      0,
      this.buffer,
      this.byteOffset + this.position,
      length * arr.BYTES_PER_ELEMENT,
    );
    DataStream.arrayToNative(arr, endianness == null ? this.endianness : endianness);
    this.position += arr.byteLength;
    return arr;
  }

  /**
   * Reads a Uint16Array of desired length and endianness from the DataStream.
   *
   * @param length Number of elements to map.
   * @param endianness Endianness of the data to read.
   * @return The read Uint16Array.
   */
  readUint16Array(length: number | null, endianness?: boolean) {
    length = length == null ? this.byteLength - this.position / 2 : length;
    const arr = new Uint16Array(length);
    DataStream.memcpy(
      arr.buffer,
      0,
      this.buffer,
      this.byteOffset + this.position,
      length * arr.BYTES_PER_ELEMENT,
    );
    DataStream.arrayToNative(arr, endianness == null ? this.endianness : endianness);
    this.position += arr.byteLength;
    return arr;
  }

  /**
   * Reads a Uint8Array of desired length from the DataStream.
   *
   * @param length Number of elements to map.
   * @param e Endianness of the data to read.
   * @return The read Uint8Array.
   */
  readUint8Array(length: number | null) {
    length = length == null ? this.byteLength - this.position : length;
    const arr = new Uint8Array(length);
    DataStream.memcpy(
      arr.buffer,
      0,
      this.buffer,
      this.byteOffset + this.position,
      length * arr.BYTES_PER_ELEMENT,
    );
    this.position += arr.byteLength;
    return arr;
  }

  /**
   * Reads a Float64Array of desired length and endianness from the DataStream.
   *
   * @param length Number of elements to map.
   * @param endianness Endianness of the data to read.
   * @return The read Float64Array.
   */
  readFloat64Array(length: number | null, endianness?: boolean) {
    length = length == null ? this.byteLength - this.position / 8 : length;
    const arr = new Float64Array(length);
    DataStream.memcpy(
      arr.buffer,
      0,
      this.buffer,
      this.byteOffset + this.position,
      length * arr.BYTES_PER_ELEMENT,
    );
    DataStream.arrayToNative(arr, endianness == null ? this.endianness : endianness);
    this.position += arr.byteLength;
    return arr;
  }

  /**
   * Reads a Float32Array of desired length and endianness from the DataStream.
   *
   * @param length Number of elements to map.
   * @param endianness Endianness of the data to read.
   * @return The read Float32Array.
   */
  readFloat32Array(length: number | null, endianness?: boolean) {
    length = length == null ? this.byteLength - this.position / 4 : length;
    const arr = new Float32Array(length);
    DataStream.memcpy(
      arr.buffer,
      0,
      this.buffer,
      this.byteOffset + this.position,
      length * arr.BYTES_PER_ELEMENT,
    );
    DataStream.arrayToNative(arr, endianness == null ? this.endianness : endianness);
    this.position += arr.byteLength;
    return arr;
  }

  /**
   * Reads a 32-bit int from the DataStream with the desired endianness.
   *
   * @param endianness Endianness of the number.
   * @return The read number.
   */
  readInt32(endianness?: boolean | null) {
    const v = this._dataView.getInt32(
      this.position,
      endianness == null ? this.endianness : endianness,
    );
    this.position += 4;
    return v;
  }

  /**
   * Reads a 16-bit int from the DataStream with the desired endianness.
   *
   * @param endianness Endianness of the number.
   * @return The read number.
   */
  readInt16(endianness?: boolean) {
    const v = this._dataView.getInt16(
      this.position,
      endianness == null ? this.endianness : endianness,
    );
    this.position += 2;
    return v;
  }

  /**
   * Reads an 8-bit int from the DataStream.
   *
   * @return The read number.
   */
  readInt8() {
    const v = this._dataView.getInt8(this.position);
    this.position += 1;
    return v;
  }

  /**
   * Reads a 32-bit unsigned int from the DataStream with the desired endianness.
   *
   * @param endianness Endianness of the number.
   * @return The read number.
   */
  readUint32(endianness?: boolean | null) {
    const v = this._dataView.getUint32(
      this.position,
      endianness == null ? this.endianness : endianness,
    );
    this.position += 4;
    return v;
  }

  /**
   * Reads a 16-bit unsigned int from the DataStream with the desired endianness.
   *
   * @param endianness Endianness of the number.
   * @return The read number.
   */
  readUint16(endianness?: boolean | null) {
    const v = this._dataView.getUint16(
      this.position,
      endianness == null ? this.endianness : endianness,
    );
    this.position += 2;
    return v;
  }

  /**
   * Reads an 8-bit unsigned int from the DataStream.
   *
   * @return The read number.
   */
  readUint8() {
    const v = this._dataView.getUint8(this.position);
    this.position += 1;
    return v;
  }

  /**
   * Reads a 32-bit float from the DataStream with the desired endianness.
   *
   * @param endianness Endianness of the number.
   * @return The read number.
   */
  readFloat32(endianness?: boolean | null) {
    const value = this._dataView.getFloat32(
      this.position,
      endianness == null ? this.endianness : endianness,
    );
    this.position += 4;
    return value;
  }

  /**
   * Reads a 64-bit float from the DataStream with the desired endianness.
   *
   * @param endianness Endianness of the number.
   * @return The read number.
   */
  readFloat64(endianness?: boolean | null) {
    const value = this._dataView.getFloat64(
      this.position,
      endianness == null ? this.endianness : endianness,
    );
    this.position += 8;
    return value;
  }

  /**
   * Native endianness. Either DataStream.BIG_ENDIAN or DataStream.LITTLE_ENDIAN
   * depending on the platform endianness.
   * @type {boolean}
   */
  static endianness = new Int8Array(new Int16Array([1]).buffer)[0] > 0;

  /**
   * Copies byteLength bytes from the src buffer at srcOffset to the
   * dst buffer at dstOffset.
   *
   * @param dst Destination ArrayBuffer to write to.
   * @param dstOffset Offset to the destination ArrayBuffer.
   * @param src Source ArrayBuffer to read from.
   * @param srcOffset Offset to the source ArrayBuffer.
   * @param byteLength Number of bytes to copy.
   */
  static memcpy(
    dst: ArrayBufferLike,
    dstOffset?: number,
    src?: ArrayBuffer,
    srcOffset?: number,
    byteLength?: number,
  ) {
    const dstU8 = new Uint8Array(dst, dstOffset, byteLength);
    const srcU8 = new Uint8Array(src, srcOffset, byteLength);
    dstU8.set(srcU8);
  }

  /**
   * Converts array to native endianness in-place.
   *
   * @param typedArray Typed array to convert.
   * @param endianness True if the data in the array is
   *                                      little-endian. Set false for big-endian.
   * @return The converted typed array.
   */
  static arrayToNative(typedArray: TypedArray, endianness?: boolean) {
    if (endianness == this.endianness) {
      return typedArray;
    } else {
      return this.flipArrayEndianness(typedArray);
    }
  }

  /**
   * Converts native endianness array to desired endianness in-place.
   *
   * @param typedArray Typed array to convert.
   * @param littleEndian True if the converted array should be
   *                               little-endian. Set false for big-endian.
   * @return The converted typed array.
   */
  static nativeToEndian(typedArray: TypedArray, littleEndian: boolean) {
    if (this.endianness == littleEndian) {
      return typedArray;
    } else {
      return this.flipArrayEndianness(typedArray);
    }
  }

  /**
   * Flips typed array endianness in-place.
   *
   * @param typedArray Typed array to flip.
   * @return The converted typed array.
   */
  static flipArrayEndianness(typedArray: TypedArray) {
    const u8 = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
    for (let i = 0; i < typedArray.byteLength; i += typedArray.BYTES_PER_ELEMENT) {
      for (let j = i + typedArray.BYTES_PER_ELEMENT - 1, k = i; j > k; j--, k++) {
        const tmp = u8[k];
        u8[k] = u8[j];
        u8[j] = tmp;
      }
    }
    return typedArray;
  }

  /**
   * Seek position where DataStream#readStruct ran into a problem.
   * Useful for debugging struct parsing.
   *
   * @type {number}
   */
  failurePosition = 0;

  /**
   * Read a string of desired length and encoding from the DataStream.
   *
   * @param length The length of the string to read in bytes.
   * @param encoding The encoding of the string data in the DataStream.
   *                           Defaults to ASCII.
   * @return The read string.
   */
  readString(length: number, encoding?: string | null) {
    if (encoding == null || encoding == 'ASCII') {
      return fromCharCodeUint8(
        this.mapUint8Array(length == null ? this.byteLength - this.position : length),
      );
    } else {
      return new TextDecoder(encoding).decode(this.mapUint8Array(length));
    }
  }

  /**
   * Read null-terminated string of desired length from the DataStream. Truncates
   * the returned string so that the null byte is not a part of it.
   *
   * @param length The length of the string to read.
   * @return The read string.
   */
  readCString(length?: number | null) {
    let i = 0;
    const blen = this.byteLength - this.position;
    const u8 = new Uint8Array(this._buffer, this._byteOffset + this.position);
    let len = blen;
    if (length != null) {
      len = Math.min(length, blen);
    }
    for (; i < len && u8[i] !== 0; i++); // find first zero byte
    const s = fromCharCodeUint8(this.mapUint8Array(i));
    if (length != null) {
      this.position += len - i;
    } else if (i != blen) {
      this.position += 1; // trailing zero if not at end of buffer
    }
    return s;
  }

  readInt64() {
    return this.readInt32() * MAX_SIZE + this.readUint32();
  }
  readUint64() {
    return this.readUint32() * MAX_SIZE + this.readUint32();
  }

  readUint24() {
    return (this.readUint8() << 16) + (this.readUint8() << 8) + this.readUint8();
  }

  /**
   * Saves the DataStream contents to the given filename.
   * Uses Chrome's anchor download property to initiate download.
   *
   * @param filename Filename to save as.
   * @return
   * @bundle DataStream-write.js
   */
  save(filename: string) {
    const blob = new Blob([this.buffer]);
    if (window.URL && URL.createObjectURL) {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      // Required in Firefox:
      document.body.appendChild(a);
      a.setAttribute('href', url);
      a.setAttribute('download', filename);
      // Required in Firefox:
      a.setAttribute('target', '_self');
      a.click();
      window.URL.revokeObjectURL(url);
    } else {
      throw "DataStream.save: Can't create object URL.";
    }
  }

  /**
   * Whether to extend DataStream buffer when trying to write beyond its size.
   * If set, the buffer is reallocated to twice its current size until the
   * requested write fits the buffer.
   *
   * @type {boolean}
   * @bundle DataStream-write.js
   */
  _dynamicSize = 1;

  /** @bundle DataStream-write.js */
  get dynamicSize() {
    return this._dynamicSize;
  }

  /** @bundle DataStream-write.js */
  set dynamicSize(v) {
    if (!v) {
      this._trimAlloc();
    }
    this._dynamicSize = v;
  }

  /**
   * Internal function to trim the DataStream buffer when required.
   * Used for stripping out the first bytes when not needed anymore.
   *
   * @return
   * @bundle DataStream-write.js
   */
  shift(offset: number) {
    const buf = new ArrayBuffer(this._byteLength - offset);
    const dst = new Uint8Array(buf);
    const src = new Uint8Array(this._buffer, offset, dst.length);
    dst.set(src);
    this.buffer = buf;
    this.position -= offset;
  }

  /**
   * Writes an Int32Array of specified endianness to the DataStream.
   *
   * @param array The array to write.
   * @param endianness Endianness of the data to write.
   * @bundle DataStream-write.js
   */
  writeInt32Array(array: ArrayLike<number>, endianness?: boolean) {
    this._realloc(array.length * 4);
    if (
      array instanceof Int32Array &&
      this.byteOffset + (this.position % array.BYTES_PER_ELEMENT) === 0
    ) {
      DataStream.memcpy(
        this._buffer,
        this.byteOffset + this.position,
        array.buffer,
        0,
        array.byteLength,
      );
      this.mapInt32Array(array.length, endianness);
    } else {
      for (let i = 0; i < array.length; i++) {
        this.writeInt32(array[i], endianness);
      }
    }
  }

  /**
   * Writes an Int16Array of specified endianness to the DataStream.
   *
   * @param array The array to write.
   * @param endianness Endianness of the data to write.
   * @bundle DataStream-write.js
   */
  writeInt16Array(array: ArrayLike<number>, endianness?: boolean) {
    this._realloc(array.length * 2);
    if (
      array instanceof Int16Array &&
      this.byteOffset + (this.position % array.BYTES_PER_ELEMENT) === 0
    ) {
      DataStream.memcpy(
        this._buffer,
        this.byteOffset + this.position,
        array.buffer,
        0,
        array.byteLength,
      );
      this.mapInt16Array(array.length, endianness);
    } else {
      for (let i = 0; i < array.length; i++) {
        this.writeInt16(array[i], endianness);
      }
    }
  }

  /**
   * Writes an Int8Array to the DataStream.
   *
   * @param array The array to write.
   * @bundle DataStream-write.js
   */
  writeInt8Array(array: ArrayLike<number>) {
    this._realloc(array.length * 1);
    if (
      array instanceof Int8Array &&
      this.byteOffset + (this.position % array.BYTES_PER_ELEMENT) === 0
    ) {
      DataStream.memcpy(
        this._buffer,
        this.byteOffset + this.position,
        array.buffer,
        0,
        array.byteLength,
      );
      this.mapInt8Array(array.length);
    } else {
      for (let i = 0; i < array.length; i++) {
        this.writeInt8(array[i]);
      }
    }
  }

  /**
   * Writes a Uint32Array of specified endianness to the DataStream.
   *
   * @param array The array to write.
   * @param endianness Endianness of the data to write.
   * @bundle DataStream-write.js
   */
  writeUint32Array(array: ArrayLike<number>, endianness?: boolean) {
    this._realloc(array.length * 4);
    if (
      array instanceof Uint32Array &&
      this.byteOffset + (this.position % array.BYTES_PER_ELEMENT) === 0
    ) {
      DataStream.memcpy(
        this._buffer,
        this.byteOffset + this.position,
        array.buffer,
        0,
        array.byteLength,
      );
      this.mapUint32Array(array.length, endianness);
    } else {
      for (let i = 0; i < array.length; i++) {
        this.writeUint32(array[i], endianness);
      }
    }
  }

  /**
   * Writes a Uint16Array of specified endianness to the DataStream.
   *
   * @param array The array to write.
   * @param endianness Endianness of the data to write.
   * @bundle DataStream-write.js
   */
  writeUint16Array(array: ArrayLike<number>, endianness?: boolean) {
    this._realloc(array.length * 2);
    if (
      array instanceof Uint16Array &&
      this.byteOffset + (this.position % array.BYTES_PER_ELEMENT) === 0
    ) {
      DataStream.memcpy(
        this._buffer,
        this.byteOffset + this.position,
        array.buffer,
        0,
        array.byteLength,
      );
      this.mapUint16Array(array.length, endianness);
    } else {
      for (let i = 0; i < array.length; i++) {
        this.writeUint16(array[i], endianness);
      }
    }
  }

  /**
   * Writes a Uint8Array to the DataStream.
   *
   * @param array The array to write.
   * @bundle DataStream-write.js
   */
  writeUint8Array(array: ArrayLike<number>) {
    this._realloc(array.length * 1);
    if (
      array instanceof Uint8Array &&
      this.byteOffset + (this.position % array.BYTES_PER_ELEMENT) === 0
    ) {
      DataStream.memcpy(
        this._buffer,
        this.byteOffset + this.position,
        array.buffer,
        0,
        array.byteLength,
      );
      this.mapUint8Array(array.length);
    } else {
      for (let i = 0; i < array.length; i++) {
        this.writeUint8(array[i]);
      }
    }
  }

  /**
   * Writes a Float64Array of specified endianness to the DataStream.
   *
   * @param array The array to write.
   * @param endianness Endianness of the data to write.
   * @bundle DataStream-write.js
   */
  writeFloat64Array(array: ArrayLike<number>, endianness?: boolean) {
    this._realloc(array.length * 8);
    if (
      array instanceof Float64Array &&
      this.byteOffset + (this.position % array.BYTES_PER_ELEMENT) === 0
    ) {
      DataStream.memcpy(
        this._buffer,
        this.byteOffset + this.position,
        array.buffer,
        0,
        array.byteLength,
      );
      this.mapFloat64Array(array.length, endianness);
    } else {
      for (let i = 0; i < array.length; i++) {
        this.writeFloat64(array[i], endianness);
      }
    }
  }

  /**
   * Writes a Float32Array of specified endianness to the DataStream.
   *
   * @param array The array to write.
   * @param endianness Endianness of the data to write.
   * @bundle DataStream-write.js
   */
  writeFloat32Array(array: ArrayLike<number>, endianness?: boolean) {
    this._realloc(array.length * 4);
    if (
      array instanceof Float32Array &&
      this.byteOffset + (this.position % array.BYTES_PER_ELEMENT) === 0
    ) {
      DataStream.memcpy(
        this._buffer,
        this.byteOffset + this.position,
        array.buffer,
        0,
        array.byteLength,
      );
      this.mapFloat32Array(array.length, endianness);
    } else {
      for (let i = 0; i < array.length; i++) {
        this.writeFloat32(array[i], endianness);
      }
    }
  }

  /**
   * Writes a 32-bit int to the DataStream with the desired endianness.
   *
   * @param value Number to write.
   * @param endianness Endianness of the number.
   * @bundle DataStream-write.js
   */
  writeInt32(value: number, endianness?: boolean | null) {
    this._realloc(4);
    this._dataView.setInt32(
      this.position,
      value,
      endianness == null ? this.endianness : endianness,
    );
    this.position += 4;
  }

  /**
   * Writes a 16-bit int to the DataStream with the desired endianness.
   *
   * @param value Number to write.
   * @param endianness Endianness of the number.
   * @bundle DataStream-write.js
   */
  writeInt16(value: number, endianness?: boolean | null) {
    this._realloc(2);
    this._dataView.setInt16(
      this.position,
      value,
      endianness == null ? this.endianness : endianness,
    );
    this.position += 2;
  }

  /**
   * Writes an 8-bit int to the DataStream.
   *
   * @param value Number to write.
   * @bundle DataStream-write.js
   */
  writeInt8(value: number) {
    this._realloc(1);
    this._dataView.setInt8(this.position, value);
    this.position += 1;
  }

  /**
   * Writes a 32-bit unsigned int to the DataStream with the desired endianness.
   *
   * @param value Number to write.
   * @param endianness Endianness of the number.
   * @bundle DataStream-write.js
   */
  writeUint32(value: number, endianness?: boolean | null) {
    this._realloc(4);
    this._dataView.setUint32(
      this.position,
      value,
      endianness == null ? this.endianness : endianness,
    );
    this.position += 4;
  }

  /**
   * Writes a 16-bit unsigned int to the DataStream with the desired endianness.
   *
   * @param value Number to write.
   * @param endianness Endianness of the number.
   * @bundle DataStream-write.js
   */
  writeUint16(value: number, endianness?: boolean | null) {
    this._realloc(2);
    this._dataView.setUint16(
      this.position,
      value,
      endianness == null ? this.endianness : endianness,
    );
    this.position += 2;
  }

  /**
   * Writes an 8-bit unsigned  int to the DataStream.
   *
   * @param value Number to write.
   * @bundle DataStream-write.js
   */
  writeUint8(value: number) {
    this._realloc(1);
    this._dataView.setUint8(this.position, value);
    this.position += 1;
  }

  /**
   * Writes a 32-bit float to the DataStream with the desired endianness.
   *
   * @param value Number to write.
   * @param endianness Endianness of the number.
   * @bundle DataStream-write.js
   */
  writeFloat32(value: number, endianness?: boolean | null) {
    this._realloc(4);
    this._dataView.setFloat32(
      this.position,
      value,
      endianness == null ? this.endianness : endianness,
    );
    this.position += 4;
  }

  /**
   * Writes a 64-bit float to the DataStream with the desired endianness.
   *
   * @param value Number to write.
   * @param endianness Endianness of the number.
   * @bundle DataStream-write.js
   */
  writeFloat64(value: number, endianness?: boolean | null) {
    this._realloc(8);
    this._dataView.setFloat64(
      this.position,
      value,
      endianness == null ? this.endianness : endianness,
    );
    this.position += 8;
  }

  /**
   * Write a UCS-2 string of desired endianness to the DataStream. The
   * lengthOverride argument lets you define the number of characters to write.
   * If the string is shorter than lengthOverride, the extra space is padded with
   * zeroes.
   *
   * @param value The string to write.
   * @param endianness The endianness to use for the written string data.
   * @param lengthOverride The number of characters to write.
   * @bundle DataStream-write.js
   */
  writeUCS2String(value: string, endianness: boolean, lengthOverride?: number) {
    if (lengthOverride == null) {
      lengthOverride = value.length;
    }
    let i: number;
    for (i = 0; i < value.length && i < lengthOverride; i++) {
      this.writeUint16(value.charCodeAt(i), endianness);
    }
    for (; i < lengthOverride; i++) {
      this.writeUint16(0);
    }
  }

  /**
   * Writes a string of desired length and encoding to the DataStream.
   *
   * @param value The string to write.
   * @param encoding The encoding for the written string data.
   *                           Defaults to ASCII.
   * @param length The number of characters to write.
   * @bundle DataStream-write.js
   */
  writeString(value: string, encoding?: string, length?: number) {
    let i = 0;
    if (encoding == null || encoding == 'ASCII') {
      if (length != null) {
        const len = Math.min(value.length, length);
        for (i = 0; i < len; i++) {
          this.writeUint8(value.charCodeAt(i));
        }
        for (; i < length; i++) {
          this.writeUint8(0);
        }
      } else {
        for (i = 0; i < value.length; i++) {
          this.writeUint8(value.charCodeAt(i));
        }
      }
    } else {
      // @ts-expect-error FIXME: TextEncoder does not expect an encoding-parameter
      this.writeUint8Array(new TextEncoder(encoding).encode(value.substring(0, length)));
    }
  }

  /**
   * Writes a null-terminated string to DataStream and zero-pads it to length
   * bytes. If length is not given, writes the string followed by a zero.
   * If string is longer than length, the written part of the string does not have
   * a trailing zero.
   *
   * @param value The string to write.
   * @param length The number of characters to write.
   * @bundle DataStream-write.js
   */
  writeCString(value: string, length?: number) {
    let i = 0;
    if (length != null) {
      const len = Math.min(value.length, length);
      for (i = 0; i < len; i++) {
        this.writeUint8(value.charCodeAt(i));
      }
      for (; i < length; i++) {
        this.writeUint8(0);
      }
    } else {
      for (i = 0; i < value.length; i++) {
        this.writeUint8(value.charCodeAt(i));
      }
      this.writeUint8(0);
    }
  }

  /**
   * Writes a struct to the DataStream. Takes a structDefinition that gives the
   * types and a struct object that gives the values. Refer to readStruct for the
   * structure of structDefinition.
   *
   * @param structDefinition Type definition of the struct.
   * @param struct The struct data object.
   * @bundle DataStream-write.js
   */
  writeStruct(structDefinition: StructDefinition, struct: Record<string, number>) {
    for (let i = 0; i < structDefinition.length; i++) {
      const structType = structDefinition[i][1];
      this.writeType(structType, struct[structDefinition[i][0]], struct);
    }
  }

  /**
   * Writes object v of type t to the DataStream.
   *
   * @param type Type of data to write.
   * @param value Value of data to write.
   * @param struct Struct to pass to write callback functions.
   * @bundle DataStream-write.js
   */
  writeType(type: StructType, value: number, struct?: Record<string, number>) {
    let tp: Array<string>;
    if (typeof type == 'function') {
      // @ts-expect-error FIXME: incorrect signature, expects DataStream, Struct
      return type(this, value);
    } else if (typeof type == 'object' && !(type instanceof Array)) {
      // @ts-expect-error FIXME: incorrect signature, expects DataStream, Struct
      return type.set(this, value, struct);
    }

    let lengthOverride: number | null = null;
    let charset: number | 'ASCII' = 'ASCII';
    let pos = this.position;
    if (typeof type == 'string' && /:/.test(type)) {
      tp = type.split(':');
      type = tp[0] as StructType;
      lengthOverride = parseInt(tp[1]);
    }
    if (typeof type == 'string' && /,/.test(type)) {
      tp = type.split(',');
      type = tp[0] as StructType;
      charset = parseInt(tp[1]);
    }

    switch (type) {
      case 'uint8':
        this.writeUint8(value);
        break;
      case 'int8':
        this.writeInt8(value);
        break;

      case 'uint16':
        this.writeUint16(value, this.endianness);
        break;
      case 'int16':
        this.writeInt16(value, this.endianness);
        break;
      case 'uint32':
        this.writeUint32(value, this.endianness);
        break;
      case 'int32':
        this.writeInt32(value, this.endianness);
        break;
      case 'float32':
        this.writeFloat32(value, this.endianness);
        break;
      case 'float64':
        this.writeFloat64(value, this.endianness);
        break;

      case 'uint16be':
        this.writeUint16(value, DataStream.BIG_ENDIAN);
        break;
      case 'int16be':
        this.writeInt16(value, DataStream.BIG_ENDIAN);
        break;
      case 'uint32be':
        this.writeUint32(value, DataStream.BIG_ENDIAN);
        break;
      case 'int32be':
        this.writeInt32(value, DataStream.BIG_ENDIAN);
        break;
      case 'float32be':
        this.writeFloat32(value, DataStream.BIG_ENDIAN);
        break;
      case 'float64be':
        this.writeFloat64(value, DataStream.BIG_ENDIAN);
        break;

      case 'uint16le':
        this.writeUint16(value, DataStream.LITTLE_ENDIAN);
        break;
      case 'int16le':
        this.writeInt16(value, DataStream.LITTLE_ENDIAN);
        break;
      case 'uint32le':
        this.writeUint32(value, DataStream.LITTLE_ENDIAN);
        break;
      case 'int32le':
        this.writeInt32(value, DataStream.LITTLE_ENDIAN);
        break;
      case 'float32le':
        this.writeFloat32(value, DataStream.LITTLE_ENDIAN);
        break;
      case 'float64le':
        this.writeFloat64(value, DataStream.LITTLE_ENDIAN);
        break;

      case 'cstring':
        this.writeCString(value as unknown as string, lengthOverride);
        break;

      case 'string':
        // @ts-expect-error FIXME: figure out type of charset
        this.writeString(value as unknown as string, charset, lengthOverride);
        break;

      case 'u16string':
        this.writeUCS2String(value as unknown as string, this.endianness, lengthOverride);
        break;

      case 'u16stringle':
        this.writeUCS2String(value as unknown as string, DataStream.LITTLE_ENDIAN, lengthOverride);
        break;

      case 'u16stringbe':
        this.writeUCS2String(value as unknown as string, DataStream.BIG_ENDIAN, lengthOverride);
        break;

      default:
        // @ts-expect-error FIXME: fix type narrowing
        if (type.length == 3) {
          const ta = type[1];
          // @ts-expect-error FIXME: value is type number
          for (let i = 0; i < value.length; i++) {
            this.writeType(ta, value[i]);
          }
          break;
        } else {
          // TODO: this said this.writeStruct before
          this.writeType(type, value);
          break;
        }
    }
    if (lengthOverride != null) {
      this.position = pos;
      this._realloc(lengthOverride);
      this.position = pos + lengthOverride;
    }
  }

  /** @bundle DataStream-write.js */
  writeUint64(value: number) {
    const h = Math.floor(value / MAX_SIZE);
    this.writeUint32(h);
    this.writeUint32(value & 0xffffffff);
  }

  /** @bundle DataStream-write.js */
  writeUint24(value: number) {
    this.writeUint8((value & 0x00ff0000) >> 16);
    this.writeUint8((value & 0x0000ff00) >> 8);
    this.writeUint8(value & 0x000000ff);
  }

  /** @bundle DataStream-write.js */
  adjustUint32(position: number, value: number) {
    const pos = this.position;
    this.seek(position);
    this.writeUint32(value);
    this.seek(pos);
  }

  /**
   * Reads a struct of data from the DataStream. The struct is defined as
   * a flat array of [name, type]-pairs. See the example below:
   *
   * ds.readStruct([
   *   ['headerTag', 'uint32'], // Uint32 in DataStream endianness.
   *   ['headerTag2', 'uint32be'], // Big-endian Uint32.
   *   ['headerTag3', 'uint32le'], // Little-endian Uint32.
   *   ['array', ['[]', 'uint32', 16]], // Uint32Array of length 16.
   *   ['array2Length', 'uint32'],
   *   ['array2', ['[]', 'uint32', 'array2Length']] // Uint32Array of length array2Length
   * ]);
   *
   * The possible values for the type are as follows:
   *
   * // Number types
   *
   * // Unsuffixed number types use DataStream endianness.
   * // To explicitly specify endianness, suffix the type with
   * // 'le' for little-endian or 'be' for big-endian,
   * // e.g. 'int32be' for big-endian int32.
   *
   * 'uint8' -- 8-bit unsigned int
   * 'uint16' -- 16-bit unsigned int
   * 'uint32' -- 32-bit unsigned int
   * 'int8' -- 8-bit int
   * 'int16' -- 16-bit int
   * 'int32' -- 32-bit int
   * 'float32' -- 32-bit float
   * 'float64' -- 64-bit float
   *
   * // String types
   * 'cstring' -- ASCII string terminated by a zero byte.
   * 'string:N' -- ASCII string of length N.
   * 'string,CHARSET:N' -- String of byteLength N encoded with given CHARSET.
   * 'u16string:N' -- UCS-2 string of length N in DataStream endianness.
   * 'u16stringle:N' -- UCS-2 string of length N in little-endian.
   * 'u16stringbe:N' -- UCS-2 string of length N in big-endian.
   *
   * // Complex types
   * [name, type, name_2, type_2, ..., name_N, type_N] -- Struct
   * function(dataStream, struct) {} -- Callback function to read and return data.
   * {get: function(dataStream, struct) {},
   *  set: function(dataStream, struct) {}}
   * -- Getter/setter functions to read and return data, handy for using the same
   *    struct definition for reading and writing structs.
   * ['[]', type, length] -- Array of given type and length. The length can be either
   *                       a number, a string that references a previously-read
   *                       field, or a callback function(struct, dataStream, type){}.
   *                       If length is '*', reads in as many elements as it can.
   *
   * @param structDefinition Struct definition object.
   * @return The read struct. Null if failed to read struct.
   * @bundle DataStream-read-struct.js
   */
  readStruct(structDefinition: StructDefinition) {
    const struct: Record<string, string> = {};
    const p = this.position;
    for (let i = 0; i < structDefinition.length; i += 1) {
      const t = structDefinition[i][1];
      const v = this.readType(t, struct);
      if (v == null) {
        if (this.failurePosition === 0) {
          this.failurePosition = this.position;
        }
        this.position = p;
        return null;
      }
      struct[structDefinition[i][0]] = v;
    }
    return struct;
  }

  /**
   * Read UCS-2 string of desired length and endianness from the DataStream.
   *
   * @param length The length of the string to read.
   * @param endianness The endianness of the string data in the DataStream.
   * @return The read string.
   * @bundle DataStream-read-struct.js
   */
  readUCS2String(length?: number, endianness?: boolean) {
    return String.fromCharCode.apply(null, this.readUint16Array(length, endianness));
  }

  /**
   * Reads an object of type t from the DataStream, passing struct as the thus-far
   * read struct to possible callbacks that refer to it. Used by readStruct for
   * reading in the values, so the type is one of the readStruct types.
   *
   * @param type Type of the object to read.
   * @param struct Struct to refer to when resolving length references
   *                         and for calling callbacks.
   * @return  Returns the object on successful read, null on unsuccessful.
   * @bundle DataStream-read-struct.js
   */
  readType(type: StructType, struct: Record<string, string>): any {
    if (typeof type == 'function') {
      return type(this, struct);
    }
    if (typeof type == 'object' && !(type instanceof Array)) {
      return type.get(this, struct);
    }
    if (type instanceof Array && type.length != 3) {
      // @ts-expect-error FIXME: incorrect signature
      return this.readStruct(type, struct);
    }

    let value:
      | null
      | number
      | Array<unknown>
      | Uint8Array
      | Uint16Array
      | Uint32Array
      | Int8Array
      | Int16Array
      | Int32Array
      | Float32Array
      | Float64Array = null;

    let lengthOverride = null;
    let charset: string | number = 'ASCII';
    let pos = this.position;
    let tp: Array<string>;
    let u: unknown;

    if (typeof type == 'string' && /:/.test(type)) {
      tp = type.split(':');
      type = tp[0] as StructType;
      lengthOverride = parseInt(tp[1]);
    }

    if (typeof type == 'string' && /,/.test(type)) {
      tp = type.split(',');
      type = tp[0] as StructType;
      charset = parseInt(tp[1]);
    }

    switch (type) {
      case 'uint8':
        value = this.readUint8();
        break;
      case 'int8':
        value = this.readInt8();
        break;

      case 'uint16':
        value = this.readUint16(this.endianness);
        break;
      case 'int16':
        value = this.readInt16(this.endianness);
        break;
      case 'uint32':
        value = this.readUint32(this.endianness);
        break;
      case 'int32':
        value = this.readInt32(this.endianness);
        break;
      case 'float32':
        value = this.readFloat32(this.endianness);
        break;
      case 'float64':
        value = this.readFloat64(this.endianness);
        break;

      case 'uint16be':
        value = this.readUint16(DataStream.BIG_ENDIAN);
        break;
      case 'int16be':
        value = this.readInt16(DataStream.BIG_ENDIAN);
        break;
      case 'uint32be':
        value = this.readUint32(DataStream.BIG_ENDIAN);
        break;
      case 'int32be':
        value = this.readInt32(DataStream.BIG_ENDIAN);
        break;
      case 'float32be':
        value = this.readFloat32(DataStream.BIG_ENDIAN);
        break;
      case 'float64be':
        value = this.readFloat64(DataStream.BIG_ENDIAN);
        break;

      case 'uint16le':
        value = this.readUint16(DataStream.LITTLE_ENDIAN);
        break;
      case 'int16le':
        value = this.readInt16(DataStream.LITTLE_ENDIAN);
        break;
      case 'uint32le':
        value = this.readUint32(DataStream.LITTLE_ENDIAN);
        break;
      case 'int32le':
        value = this.readInt32(DataStream.LITTLE_ENDIAN);
        break;
      case 'float32le':
        value = this.readFloat32(DataStream.LITTLE_ENDIAN);
        break;
      case 'float64le':
        value = this.readFloat64(DataStream.LITTLE_ENDIAN);
        break;

      case 'cstring':
        value = this.readCString(lengthOverride);
        break;

      case 'string':
        // @ts-expect-error FIXME: charset expected to be string, but can also be number
        value = this.readString(lengthOverride, charset);
        break;

      case 'u16string':
        value = this.readUCS2String(lengthOverride, this.endianness);
        break;

      case 'u16stringle':
        value = this.readUCS2String(lengthOverride, DataStream.LITTLE_ENDIAN);
        break;

      case 'u16stringbe':
        value = this.readUCS2String(lengthOverride, DataStream.BIG_ENDIAN);
        break;

      default:
        if (Array.isArray(type) && type.length == 3) {
          let ta = type[1];
          let len = type[2];
          let length: null | number = 0;
          if (typeof len == 'function') {
            length = len(struct, this, type);
          } else if (typeof len == 'string' && struct[len] != null) {
            length = parseInt(struct[len]);
          } else {
            // NOTE: this used to be length = len
            length = typeof len === 'number' ? len : parseInt(len);
          }
          if (typeof ta == 'string') {
            let tap = ta.replace(/(le|be)$/, '');
            let endianness: null | boolean = null;
            if (/le$/.test(ta)) {
              endianness = DataStream.LITTLE_ENDIAN;
            } else if (/be$/.test(ta)) {
              endianness = DataStream.BIG_ENDIAN;
            }
            if (len == '*') {
              length = null;
            }
            switch (tap) {
              case 'uint8':
                value = this.readUint8Array(length);
                break;
              case 'uint16':
                value = this.readUint16Array(length, endianness);
                break;
              case 'uint32':
                value = this.readUint32Array(length, endianness);
                break;
              case 'int8':
                value = this.readInt8Array(length);
                break;
              case 'int16':
                value = this.readInt16Array(length, endianness);
                break;
              case 'int32':
                value = this.readInt32Array(length, endianness);
                break;
              case 'float32':
                value = this.readFloat32Array(length, endianness);
                break;
              case 'float64':
                value = this.readFloat64Array(length, endianness);
                break;
              case 'cstring':
              case 'utf16string':
              case 'string':
                if (length == null) {
                  value = [];
                  while (!this.isEof()) {
                    u = this.readType(ta, struct);
                    if (u == null) break;
                    value.push(u);
                  }
                } else {
                  value = new Array(length);
                  for (let i = 0; i < length; i++) {
                    value[i] = this.readType(ta, struct);
                  }
                }
                break;
            }
          } else {
            if (len == '*') {
              value = [];
              while (true) {
                const p = this.position;
                try {
                  const o = this.readType(ta, struct);
                  if (o == null) {
                    this.position = p;
                    break;
                  }
                  value.push(o);
                } catch (e) {
                  this.position = p;
                  break;
                }
              }
            } else {
              value = new Array(length);
              for (let i = 0; i < length; i++) {
                u = this.readType(ta, struct);
                if (u == null) return null;
                value[i] = u;
              }
            }
          }
          break;
        }
    }
    if (lengthOverride != null) {
      this.position = pos + lengthOverride;
    }
    return value;
  }

  /**
   * Maps an Int32Array into the DataStream buffer, swizzling it to native
   * endianness in-place. The current offset from the start of the buffer needs to
   * be a multiple of element size, just like with typed array views.
   *
   * Nice for quickly reading in data. Warning: potentially modifies the buffer
   * contents.
   *
   * @param length Number of elements to map.
   * @param endianness Endianness of the data to read.
   * @return Int32Array to the DataStream backing buffer.
   * @bundle DataStream-map.js
   */
  mapInt32Array(length: number, endianness?: boolean) {
    this._realloc(length * 4);
    const arr = new Int32Array(this._buffer, this.byteOffset + this.position, length);
    DataStream.arrayToNative(arr, endianness == null ? DataStream.endianness : endianness);
    this.position += length * 4;
    return arr;
  }

  /**
   * Maps an Int16Array into the DataStream buffer, swizzling it to native
   * endianness in-place. The current offset from the start of the buffer needs to
   * be a multiple of element size, just like with typed array views.
   *
   * Nice for quickly reading in data. Warning: potentially modifies the buffer
   * contents.
   *
   * @param length Number of elements to map.
   * @param endianness Endianness of the data to read.
   * @return Int16Array to the DataStream backing buffer.
   * @bundle DataStream-map.js
   */
  mapInt16Array(length: number, endianness: boolean) {
    this._realloc(length * 2);
    const arr = new Int16Array(this._buffer, this.byteOffset + this.position, length);
    DataStream.arrayToNative(arr, endianness == null ? this.endianness : endianness);
    this.position += length * 2;
    return arr;
  }

  /**
   * Maps an Int8Array into the DataStream buffer.
   *
   * Nice for quickly reading in data.
   *
   * @param length Number of elements to map.
   * @param endianness Endianness of the data to read.
   * @return Int8Array to the DataStream backing buffer.
   * @bundle DataStream-map.js
   */
  mapInt8Array(length: number, endianness?: boolean) {
    this._realloc(length * 1);
    const arr = new Int8Array(this._buffer, this.byteOffset + this.position, length);
    this.position += length * 1;
    return arr;
  }

  /**
   * Maps a Uint32Array into the DataStream buffer, swizzling it to native
   * endianness in-place. The current offset from the start of the buffer needs to
   * be a multiple of element size, just like with typed array views.
   *
   * Nice for quickly reading in data. Warning: potentially modifies the buffer
   * contents.
   *
   * @param length Number of elements to map.
   * @param endianness Endianness of the data to read.
   * @return Uint32Array to the DataStream backing buffer.
   * @bundle DataStream-map.js
   */
  mapUint32Array(length: number, endianness?: boolean) {
    this._realloc(length * 4);
    const arr = new Uint32Array(this._buffer, this.byteOffset + this.position, length);
    DataStream.arrayToNative(arr, endianness == null ? this.endianness : endianness);
    this.position += length * 4;
    return arr;
  }

  /**
   * Maps a Uint16Array into the DataStream buffer, swizzling it to native
   * endianness in-place. The current offset from the start of the buffer needs to
   * be a multiple of element size, just like with typed array views.
   *
   * Nice for quickly reading in data. Warning: potentially modifies the buffer
   * contents.
   *
   * @param length Number of elements to map.
   * @param endianness Endianness of the data to read.
   * @return Uint16Array to the DataStream backing buffer.
   * @bundle DataStream-map.js
   */
  mapUint16Array(length: number, endianness?: boolean) {
    this._realloc(length * 2);
    const arr = new Uint16Array(this._buffer, this.byteOffset + this.position, length);
    DataStream.arrayToNative(arr, endianness == null ? this.endianness : endianness);
    this.position += length * 2;
    return arr;
  }

  /**
   * Maps a Float64Array into the DataStream buffer, swizzling it to native
   * endianness in-place. The current offset from the start of the buffer needs to
   * be a multiple of element size, just like with typed array views.
   *
   * Nice for quickly reading in data. Warning: potentially modifies the buffer
   * contents.
   *
   * @param length Number of elements to map.
   * @param endianness Endianness of the data to read.
   * @return Float64Array to the DataStream backing buffer.
   * @bundle DataStream-map.js
   */
  mapFloat64Array(length: number, endianness?: boolean) {
    this._realloc(length * 8);
    const arr = new Float64Array(this._buffer, this.byteOffset + this.position, length);
    DataStream.arrayToNative(arr, endianness == null ? this.endianness : endianness);
    this.position += length * 8;
    return arr;
  }

  /**
   * Maps a Float32Array into the DataStream buffer, swizzling it to native
   * endianness in-place. The current offset from the start of the buffer needs to
   * be a multiple of element size, just like with typed array views.
   *
   * Nice for quickly reading in data. Warning: potentially modifies the buffer
   * contents.
   *
   * @param length Number of elements to map.
   * @param endianness Endianness of the data to read.
   * @return Float32Array to the DataStream backing buffer.
   * @bundle DataStream-map.js
   */
  mapFloat32Array(length: number, endianness?: boolean) {
    this._realloc(length * 4);
    const arr = new Float32Array(this._buffer, this.byteOffset + this.position, length);
    DataStream.arrayToNative(arr, endianness == null ? this.endianness : endianness);
    this.position += length * 4;
    return arr;
  }
}

function fromCharCodeUint8(uint8arr: Uint8Array) {
  const arr: Array<number> = [];
  for (let i = 0; i < uint8arr.length; i++) {
    arr[i] = uint8arr[i];
  }
  return String.fromCharCode.apply(null, arr);
}

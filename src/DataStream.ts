import { NumberArray } from './types';
/**
 DataStream reads scalars, arrays and structs of data from an ArrayBuffer.
 It's like a file-like DataView on steroids.
 
 @param {ArrayBuffer} arrayBuffer ArrayBuffer to read from.
 @param {?Number} byteOffset Offset from arrayBuffer beginning for the DataStream.
 @param {?Boolean} endianness DataStream.BIG_ENDIAN or DataStream.LITTLE_ENDIAN (the default).
 */
import ds_write from './DataStream-write';
import ds_map from './DataStream-map';
import ds_read_struct from './DataStream-read-struct';

var MAX_SIZE = Math.pow(2, 32);

export class BoxBuffer extends ArrayBuffer {
  fileStart = 0;
  usedBytes = 0;
  constructor(byteLength: number) {
    super(byteLength);
  }
}

export class DataStream {
  /**
    Big-endian const to use as default endianness.
    @type {boolean}
    */
  static BIG_ENDIAN = false;

  /**
  Little-endian const to use as default endianness.
  @type {boolean}
  */
  static LITTLE_ENDIAN = true;
  endianness = false;

  _byteOffset = 0;
  _buffer = new BoxBuffer(0);
  _dataView = new DataView(this._buffer);

  /**
    Virtual byte length of the DataStream backing buffer.
    Updated to be max of original buffer size and last written size.
    If dynamicSize is false is set to buffer size.
    @type {number}
    */
  _byteLength = 0;

  _dynamicSize = true;
  position = 0;

  constructor(arrayBuffer?: BoxBuffer, byteOffset?: number, endianness?: boolean) {
    this._byteOffset = byteOffset || 0;
    if (arrayBuffer instanceof ArrayBuffer) {
      this.buffer = arrayBuffer;
    } else if (typeof arrayBuffer == 'object') {
      this.dataView = arrayBuffer;
      if (byteOffset) {
        this._byteOffset += byteOffset;
      }
    } else {
      this.buffer = new BoxBuffer(arrayBuffer || 0);
    }

    this.endianness = endianness == undefined ? DataStream.LITTLE_ENDIAN : endianness;
  }

  getPosition() {
    return this.position;
  }

  /**
    Internal function to resize the DataStream buffer when required.
    @param {number} extra Number of bytes to add to the buffer allocation.
    @return {null}
    */
  _realloc(extra: number) {
    if (!this._dynamicSize) return;

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
    const buf = new BoxBuffer(blen);
    const src = new Uint8Array(this._buffer);
    const dst = new Uint8Array(buf, 0, src.length);
    dst.set(src);
    this.buffer = buf;
    this._byteLength = req;
  }

  /**
    Internal function to trim the DataStream buffer when required.
    Used for stripping out the extra bytes from the backing buffer when
    the virtual byteLength is smaller than the buffer byteLength (happens after
    growing the buffer with writes and not filling the extra space completely).

    @return {null}
    */
  _trimAlloc() {
    if (this._byteLength == this._buffer.byteLength) {
      return;
    }
    const buf = new BoxBuffer(this._byteLength);
    const dst = new Uint8Array(buf);
    const src = new Uint8Array(this._buffer, 0, dst.length);
    dst.set(src);
    this.buffer = buf;
  }

  /**
    Returns the byte length of the DataStream object.
    @type {number}
    */
  public get byteLength(): number {
    return this._byteLength - this._byteOffset;
  }

  /**
    Set/get the backing ArrayBuffer of the DataStream object.
    The setter updates the DataView to point to the new buffer.
    @type {Object}
    */
  public get buffer(): BoxBuffer {
    this._trimAlloc();
    return this._buffer;
  }
  public set buffer(v: BoxBuffer) {
    this._buffer = v;
    this._dataView = new DataView(this._buffer, this._byteOffset);
    this._byteLength = this._buffer.byteLength;
  }

  /**
    Set/get the backing DataView of the DataStream object.
    The setter updates the buffer and byteOffset to point to the DataView values.
    @type {Object}
    */
  public get dataView(): DataView {
    return this._dataView;
  }
  public set dataView(v: DataView) {
    this._byteOffset = v.byteOffset;
    this._buffer = v.buffer as BoxBuffer;
    this._dataView = new DataView(this._buffer, this._byteOffset);
    this._byteLength = this._byteOffset + v.byteLength;
  }

  /**
  Set/get the byteOffset of the DataStream object.
  The setter updates the DataView to point to the new byteOffset.
  @type {number}
  */
  public get byteOffset(): number {
    return this._byteOffset;
  }
  public set byteOffset(v: number) {
    this._byteOffset = v;
    this._dataView = new DataView(this._buffer, this._byteOffset);
    this._byteLength = this._buffer.byteLength;
  }

  public get dynamicSize(): boolean {
    return this._dynamicSize;
  }

  public set dynamicSize(v: boolean) {
    if (v) {
      this._trimAlloc();
    }
    this._dynamicSize = v;
  }

  /**
    Sets the DataStream read/write position to given position.
    Clamps between 0 and DataStream length.

    @param {number} pos Position to seek to.
    @return {null}
    */
  seek(pos: number, fromStart?: boolean, markAsUsed?: boolean) {
    const npos = Math.max(0, Math.min(this.byteLength, pos));
    this.position = isNaN(npos) || !isFinite(npos) ? 0 : npos;
  }

  /**
    Returns true if the DataStream seek pointer is at the end of buffer and
    there's no more data to read.

    @return {boolean} True if the seek pointer is at the end of the buffer.
    */
  isEof() {
    return this.position >= this._byteLength;
  }

  /**
      Maps a Uint8Array into the DataStream buffer.

      Nice for quickly reading in data.

      @param {number} length Number of elements to map.
      @param {?boolean} e Endianness of the data to read.
      @return {Object} Uint8Array to the DataStream backing buffer.
      */
  mapUint8Array(length: number) {
    this._realloc(length * 1);
    const arr = new Uint8Array(this._buffer, this.byteOffset + this.position, length);
    this.position += length * 1;
    return arr;
  }

  /**
      Reads an Int32Array of desired length and endianness from the DataStream.

      @param {number} length Number of elements to map.
      @param {?boolean} e Endianness of the data to read.
      @return {Object} The read Int32Array.
     */
  readInt32Array(length?: number, e?: boolean) {
    length = length === undefined ? this.byteLength - this.position / 4 : length;
    const arr = new Int32Array(length);
    DataStream.memcpy(
      arr.buffer,
      0,
      this.buffer,
      this.byteOffset + this.position,
      length * arr.BYTES_PER_ELEMENT
    );
    DataStream.arrayToNative(arr, e === undefined ? this.endianness : e);
    this.position += arr.byteLength;
    return arr;
  }

  /**
    Reads an Int16Array of desired length and endianness from the DataStream.

    @param {number} length Number of elements to map.
    @param {?boolean} e Endianness of the data to read.
    @return {Object} The read Int16Array.
    */
  readInt16Array(length?: number, e?: boolean) {
    length = length === undefined ? this.byteLength - this.position / 2 : length;
    const arr = new Int16Array(length);
    DataStream.memcpy(
      arr.buffer,
      0,
      this.buffer,
      this.byteOffset + this.position,
      length * arr.BYTES_PER_ELEMENT
    );
    DataStream.arrayToNative(arr, e === undefined ? this.endianness : e);
    this.position += arr.byteLength;
    return arr;
  }

  /**
    Reads an Int8Array of desired length from the DataStream.

    @param {number} length Number of elements to map.
    @param {?boolean} e Endianness of the data to read.
    @return {Object} The read Int8Array.
    */
  readInt8Array(length?: number) {
    length = length === undefined ? this.byteLength - this.position : length;
    const arr = new Int8Array(length);
    DataStream.memcpy(
      arr.buffer,
      0,
      this.buffer,
      this.byteOffset + this.position,
      length * arr.BYTES_PER_ELEMENT
    );
    this.position += arr.byteLength;
    return arr;
  }

  /**
      Reads a Uint32Array of desired length and endianness from the DataStream.

      @param {number} length Number of elements to map.
      @param {?boolean} e Endianness of the data to read.
      @return {Object} The read Uint32Array.
     */
  readUint32Array(length?: number, e?: boolean) {
    length = length === undefined ? this.byteLength - this.position / 4 : length;
    const arr = new Uint32Array(length);
    DataStream.memcpy(
      arr.buffer,
      0,
      this.buffer,
      this.byteOffset + this.position,
      length * arr.BYTES_PER_ELEMENT
    );
    DataStream.arrayToNative(arr, e === undefined ? this.endianness : e);
    this.position += arr.byteLength;
    return arr;
  }

  /**
    Reads a Uint16Array of desired length and endianness from the DataStream.

    @param {number} length Number of elements to map.
    @param {?boolean} e Endianness of the data to read.
    @return {Object} The read Uint16Array.
    */
  readUint16Array(length?: number, e?: boolean) {
    length = length === undefined ? this.byteLength - this.position / 2 : length;
    const arr = new Uint16Array(length);
    DataStream.memcpy(
      arr.buffer,
      0,
      this.buffer,
      this.byteOffset + this.position,
      length * arr.BYTES_PER_ELEMENT
    );
    DataStream.arrayToNative(arr, e === undefined ? this.endianness : e);
    this.position += arr.byteLength;
    return arr;
  }

  /**
    Reads a Uint8Array of desired length from the DataStream.

    @param {number} length Number of elements to map.
    @param {?boolean} e Endianness of the data to read.
    @return {Object} The read Uint8Array.
    */
  readUint8Array(length?: number) {
    length = length === undefined ? this.byteLength - this.position : length;
    const arr = new Uint8Array(length);
    DataStream.memcpy(
      arr.buffer,
      0,
      this.buffer,
      this.byteOffset + this.position,
      length * arr.BYTES_PER_ELEMENT
    );
    this.position += arr.byteLength;
    return arr;
  }

  /**
    Reads a Float64Array of desired length and endianness from the DataStream.

    @param {number} length Number of elements to map.
    @param {?boolean} e Endianness of the data to read.
    @return {Object} The read Float64Array.
    */
  readFloat64Array(length?: number, e?: boolean) {
    length = length === undefined ? this.byteLength - this.position / 8 : length;
    const arr = new Float64Array(length);
    DataStream.memcpy(
      arr.buffer,
      0,
      this.buffer,
      this.byteOffset + this.position,
      length * arr.BYTES_PER_ELEMENT
    );
    DataStream.arrayToNative(arr, e === undefined ? this.endianness : e);
    this.position += arr.byteLength;
    return arr;
  }

  /**
    Reads a Float32Array of desired length and endianness from the DataStream.

    @param {number} length Number of elements to map.
    @param {?boolean} e Endianness of the data to read.
    @return {Object} The read Float32Array.
    */
  readFloat32Array(length?: number, e?: boolean) {
    length = length === undefined ? this.byteLength - this.position / 4 : length;
    const arr = new Float32Array(length);
    DataStream.memcpy(
      arr.buffer,
      0,
      this.buffer,
      this.byteOffset + this.position,
      length * arr.BYTES_PER_ELEMENT
    );
    DataStream.arrayToNative(arr, e === undefined ? this.endianness : e);
    this.position += arr.byteLength;
    return arr;
  }

  /**
      Reads a 32-bit int from the DataStream with the desired endianness.

      @param {?boolean} e Endianness of the number.
      @return {number} The read number.
     */
  readInt32(e?: boolean) {
    const v = this._dataView.getInt32(this.position, e === undefined ? this.endianness : e);
    this.position += 4;
    return v;
  }

  /**
    Reads a 16-bit int from the DataStream with the desired endianness.

    @param {?boolean} e Endianness of the number.
    @return {number} The read number.
    */
  readInt16(e?: boolean) {
    const v = this._dataView.getInt16(this.position, e === undefined ? this.endianness : e);
    this.position += 2;
    return v;
  }

  /**
    Reads an 8-bit int from the DataStream.

    @return {number} The read number.
    */
  readInt8() {
    const v = this._dataView.getInt8(this.position);
    this.position += 1;
    return v;
  }

  /**
    Reads a 32-bit unsigned int from the DataStream with the desired endianness.

    @param {?boolean} e Endianness of the number.
    @return {number} The read number.
    */
  readUint32(e?: boolean) {
    const v = this._dataView.getUint32(this.position, e === undefined ? this.endianness : e);
    this.position += 4;
    return v;
  }

  /**
    Reads a 16-bit unsigned int from the DataStream with the desired endianness.

    @param {?boolean} e Endianness of the number.
    @return {number} The read number.
    */
  readUint16(e?: boolean) {
    const v = this._dataView.getUint16(this.position, e === undefined ? this.endianness : e);
    this.position += 2;
    return v;
  }

  /**
    Reads an 8-bit unsigned int from the DataStream.

    @return {number} The read number.
    */
  readUint8() {
    const v = this._dataView.getUint8(this.position);
    this.position += 1;
    return v;
  }

  /**
    Reads a 32-bit float from the DataStream with the desired endianness.

    @param {?boolean} e Endianness of the number.
    @return {number} The read number.
    */
  readFloat32(e?: boolean) {
    const v = this._dataView.getFloat32(this.position, e === undefined ? this.endianness : e);
    this.position += 4;
    return v;
  }

  /**
    Reads a 64-bit float from the DataStream with the desired endianness.

    @param {?boolean} e Endianness of the number.
    @return {number} The read number.
    */
  readFloat64(e?: boolean) {
    const v = this._dataView.getFloat64(this.position, e === undefined ? this.endianness : e);
    this.position += 8;
    return v;
  }

  /**
    Native endianness. Either DataStream.BIG_ENDIAN or DataStream.LITTLE_ENDIAN
    depending on the platform endianness.

    @type {boolean}
    */
  static endianness = new Int8Array(new Int16Array([1]).buffer)[0] > 0;

  /**
    Copies byteLength bytes from the src buffer at srcOffset to the
    dst buffer at dstOffset.

    @param {Object} dst Destination ArrayBuffer to write to.
    @param {number} dstOffset Offset to the destination ArrayBuffer.
    @param {Object} src Source ArrayBuffer to read from.
    @param {number} srcOffset Offset to the source ArrayBuffer.
    @param {number} byteLength Number of bytes to copy.
    */
  static memcpy(
    dst: ArrayBuffer,
    dstOffset: number,
    src: ArrayBuffer,
    srcOffset: number,
    byteLength: number
  ) {
    const dstU8 = new Uint8Array(dst, dstOffset, byteLength);
    const srcU8 = new Uint8Array(src, srcOffset, byteLength);
    dstU8.set(srcU8);
  }

  /**
    Converts array to native endianness in-place.

    @param {Object} array Typed array to convert.
    @param {boolean} arrayIsLittleEndian True if the data in the array is
                                          little-endian. Set false for big-endian.
    @return {Object} The converted typed array.
    */
  static arrayToNative(array: NumberArray, arrayIsLittleEndian: boolean) {
    if (arrayIsLittleEndian == DataStream.endianness) {
      return array;
    } else {
      return DataStream.flipArrayEndianness(array);
    }
  }

  /**
    Converts native endianness array to desired endianness in-place.

    @param {Object} array Typed array to convert.
    @param {boolean} littleEndian True if the converted array should be
                                  little-endian. Set false for big-endian.
    @return {Object} The converted typed array.
    */
  static nativeToEndian(array: NumberArray, littleEndian: boolean) {
    if (DataStream.endianness === littleEndian) {
      return array;
    } else {
      return DataStream.flipArrayEndianness(array);
    }
  }

  /**
    Flips typed array endianness in-place.

    @param {Object} array Typed array to flip.
    @return {Object} The converted typed array.
    */
  static flipArrayEndianness(array: NumberArray) {
    const u8 = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    for (let i = 0; i < array.byteLength; i += array.BYTES_PER_ELEMENT) {
      for (let j = i + array.BYTES_PER_ELEMENT - 1, k = i; j > k; j--, k++) {
        let tmp = u8[k];
        u8[k] = u8[j];
        u8[j] = tmp;
      }
    }
    return array;
  }

  /**
    Seek position where DataStream#readStruct ran into a problem.
    Useful for debugging struct parsing.

    @type {number}
    */
  failurePosition = 0;

  static fromCharCodeUint8(uint8arr: Uint8Array) {
    const arr = [];
    for (let i = 0; i < uint8arr.length; i++) {
      arr[i] = uint8arr[i];
    }
    return String.fromCharCode.apply(null, arr);
  }

  /**
    Read a string of desired length and encoding from the DataStream.

    @param {number} length The length of the string to read in bytes.
    @param {?string} encoding The encoding of the string data in the DataStream.
                              Defaults to ASCII.
    @return {string} The read string.
    */
  readString(length?: number, encoding?: string) {
    length = length === undefined ? this.byteLength - this.position : length;
    if (!encoding || encoding == 'ASCII') {
      return DataStream.fromCharCodeUint8.apply(null, [this.mapUint8Array(length)]);
    } else {
      return new TextDecoder(encoding).decode(this.mapUint8Array(length));
    }
  }

  /**
    Read null-terminated string of desired length from the DataStream. Truncates
    the returned string so that the null byte is not a part of it.

    @param {?number} length The length of the string to read.
    @return {string} The read string.
    */
  readCString(length?: number) {
    const blen = this.byteLength - this.position;
    const u8 = new Uint8Array(this._buffer, this._byteOffset + this.position);
    let len = blen;
    if (length) {
      len = Math.min(length, blen);
    }
    let i;
    for (i = 0; i < len && u8[i] !== 0; i++); // find first zero byte
    const s = DataStream.fromCharCodeUint8.apply(null, [this.mapUint8Array(i)]);
    if (length) {
      this.position += len - i;
    } else if (i != blen) {
      this.position += 1; // trailing zero if not at end of buffer
    }
    return s;
  }

  /*
      TODO: fix endianness for 24/64-bit fields
      TODO: check range/support for 64-bits numbers in JavaScript
  */
  readInt64() {
    return this.readInt32() * MAX_SIZE + this.readUint32();
  }
  readUint64() {
    return this.readUint32() * MAX_SIZE + this.readUint32();
  }

  readUint24() {
    return (this.readUint8() << 16) + (this.readUint8() << 8) + this.readUint8();
  }

  mapInt32Array = ds_map.mapInt32Array;
  mapInt16Array = ds_map.mapInt16Array;
  mapInt8Array = ds_map.mapInt8Array;
  mapUint32Array = ds_map.mapUint32Array;
  mapUint16Array = ds_map.mapUint16Array;
  mapFloat64Array = ds_map.mapFloat64Array;
  mapFloat32Array = ds_map.mapFloat32Array;

  save = ds_write.save;
  shift = ds_write.shift;
  writeInt32Array = ds_write.writeInt32Array;
  writeInt16Array = ds_write.writeInt16Array;
  writeInt8Array = ds_write.writeInt8Array;
  writeUint32Array = ds_write.writeUint32Array;
  writeUint16Array = ds_write.writeUint16Array;
  writeUint8Array = ds_write.writeUint8Array;
  writeFloat64Array = ds_write.writeFloat64Array;
  writeFloat32Array = ds_write.writeFloat32Array;
  writeInt32 = ds_write.writeInt32;
  writeInt16 = ds_write.writeInt16;
  writeInt8 = ds_write.writeInt8;
  writeUint32 = ds_write.writeUint32;
  writeUint16 = ds_write.writeUint16;
  writeUint8 = ds_write.writeUint8;
  writeFloat32 = ds_write.writeFloat32;
  writeFloat64 = ds_write.writeFloat64;
  writeUCS2String = ds_write.writeUCS2String;
  writeString = ds_write.writeString;
  writeCString = ds_write.writeCString;
  writeStruct = ds_write.writeStruct;
  writeType = ds_write.writeType;
  writeUint64 = ds_write.writeUint64;
  writeUint24 = ds_write.writeUint24;
  adjustUint32 = ds_write.adjustUint32;

  readStruct = ds_read_struct.readStruct;
  readUCS2String = ds_read_struct.readUCS2String;
  readType = ds_read_struct.readType;
}

export class MP4BoxStream {
  buffer: ArrayBuffer;
  dataview: DataView;
  position = 0;

  constructor(arrayBuffer: ArrayBuffer) {
    if (arrayBuffer instanceof ArrayBuffer) {
      this.buffer = arrayBuffer;
      this.dataview = new DataView(arrayBuffer);
    } else {
      throw 'Needs an array buffer';
    }
  }

  /*************************************************************************
   *         Common API between MultiBufferStream and SimpleStream         *
   *************************************************************************/

  getPosition() {
    return this.position;
  }

  getEndPosition() {
    return this.buffer.byteLength;
  }

  getLength() {
    return this.buffer.byteLength;
  }

  seek(pos: number) {
    var npos = Math.max(0, Math.min(this.buffer.byteLength, pos));
    this.position = isNaN(npos) || !isFinite(npos) ? 0 : npos;
    return true;
  }

  isEos() {
    return this.getPosition() >= this.getEndPosition();
  }

  /*************************************************************************
   *            Read methods, simimar to DataStream but simpler            *
   *************************************************************************/

  readAnyInt(size: number, signed: boolean) {
    var res = 0;
    if (this.position + size <= this.buffer.byteLength) {
      switch (size) {
        case 1:
          if (signed) {
            res = this.dataview.getInt8(this.position);
          } else {
            res = this.dataview.getUint8(this.position);
          }
          break;
        case 2:
          if (signed) {
            res = this.dataview.getInt16(this.position);
          } else {
            res = this.dataview.getUint16(this.position);
          }
          break;
        case 3:
          if (signed) {
            throw 'No method for reading signed 24 bits values';
          } else {
            res = this.dataview.getUint8(this.position) << 16;
            res |= this.dataview.getUint8(this.position + 1) << 8;
            res |= this.dataview.getUint8(this.position + 2);
          }
          break;
        case 4:
          if (signed) {
            res = this.dataview.getInt32(this.position);
          } else {
            res = this.dataview.getUint32(this.position);
          }
          break;
        case 8:
          if (signed) {
            throw 'No method for reading signed 64 bits values';
          } else {
            res = this.dataview.getUint32(this.position) << 32;
            res |= this.dataview.getUint32(this.position + 4);
          }
          break;
        default:
          throw 'readInt method not implemented for size: ' + size;
      }
      this.position += size;
      return res;
    } else {
      throw 'Not enough bytes in buffer';
    }
  }

  readUint8() {
    return this.readAnyInt(1, false);
  }

  readUint16() {
    return this.readAnyInt(2, false);
  }

  readUint24() {
    return this.readAnyInt(3, false);
  }

  readUint32() {
    return this.readAnyInt(4, false);
  }

  readUint64() {
    return this.readAnyInt(8, false);
  }

  readString(length: number) {
    if (this.position + length <= this.buffer.byteLength) {
      var s = '';
      for (var i = 0; i < length; i++) {
        s += String.fromCharCode(this.readUint8());
      }
      return s;
    } else {
      throw 'Not enough bytes in buffer';
    }
  }

  readCString(): string {
    var arr = [];
    while (true) {
      var b = this.readUint8();
      if (b !== 0) {
        arr.push(b);
      } else {
        break;
      }
    }
    return String.fromCharCode.apply(null, arr);
  }

  readInt8() {
    return this.readAnyInt(1, true);
  }

  readInt16() {
    return this.readAnyInt(2, true);
  }

  readInt32() {
    return this.readAnyInt(4, true);
  }

  readInt64() {
    return this.readAnyInt(8, false);
  }

  readUint8Array(length: number) {
    var arr = new Uint8Array(length);
    for (var i = 0; i < length; i++) {
      arr[i] = this.readUint8();
    }
    return arr;
  }

  readInt16Array(length: number) {
    var arr = new Int16Array(length);
    for (var i = 0; i < length; i++) {
      arr[i] = this.readInt16();
    }
    return arr;
  }

  readUint16Array(length: number) {
    var arr = new Int16Array(length);
    for (var i = 0; i < length; i++) {
      arr[i] = this.readUint16();
    }
    return arr;
  }

  readUint32Array(length: number) {
    var arr = new Uint32Array(length);
    for (var i = 0; i < length; i++) {
      arr[i] = this.readUint32();
    }
    return arr;
  }

  readInt32Array(length: number) {
    var arr = new Int32Array(length);
    for (var i = 0; i < length; i++) {
      arr[i] = this.readInt32();
    }
    return arr;
  }
}

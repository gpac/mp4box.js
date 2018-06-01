var MP4BoxStream = function(arrayBuffer) {
  if (arrayBuffer instanceof ArrayBuffer) {
    this.buffer = arrayBuffer;
    this.dataview = new DataView(arrayBuffer);
  } else {
    throw ("Needs an array buffer");
  }
  this.position = 0;
};

/*************************************************************************
  Common API between MultiBufferStream and SimpleStream
 *************************************************************************/
MP4BoxStream.prototype.getPosition = function() {
  return this.position;
}

MP4BoxStream.prototype.getEndPosition = function() {
  return this.buffer.byteLength;
}

MP4BoxStream.prototype.getLength = function() {
  return this.buffer.byteLength;
}

MP4BoxStream.prototype.seek = function (pos) {
  var npos = Math.max(0, Math.min(this.buffer.byteLength, pos));
  this.position = (isNaN(npos) || !isFinite(npos)) ? 0 : npos;
  return true;
}

MP4BoxStream.prototype.isEos = function () {
  return this.getPosition() >= this.getEndPosition();
}

/*************************************************************************
  Read methods, simimar to DataStream but simpler
 *************************************************************************/
MP4BoxStream.prototype.readAnyInt = function(size, signed) {
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
          throw ("No method for reading signed 24 bits values");
        } else {
          res = this.dataview.getUint8(this.position) << 16;
          res |= this.dataview.getUint8(this.position) << 8;
          res |= this.dataview.getUint8(this.position);
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
          throw ("No method for reading signed 64 bits values");
        } else {
          res = this.dataview.getUint32(this.position) << 32;          
          res |= this.dataview.getUint32(this.position);
        }
        break;
      default:
        throw ("readInt method not implemented for size: "+size);  
    }
    this.position+= size;
    return res;
  } else {
    throw ("Not enough bytes in buffer");
  }
}

MP4BoxStream.prototype.readUint8 = function() {
  return this.readAnyInt(1, false);
}

MP4BoxStream.prototype.readUint16 = function() {
  return this.readAnyInt(2, false);
}

MP4BoxStream.prototype.readUint24 = function() {
  return this.readAnyInt(3, false);
}

MP4BoxStream.prototype.readUint32 = function() {
  return this.readAnyInt(4, false);
}

MP4BoxStream.prototype.readUint64 = function() {
  return this.readAnyInt(8, false);
}

MP4BoxStream.prototype.readString = function(length) {
  if (this.position + length <= this.buffer.byteLength) {
    var s = "";
    for (var i = 0; i < length; i++) {
      s += String.fromCharCode(this.readUint8());
    }
    return s;
  } else {
    throw ("Not enough bytes in buffer");
  }
}

MP4BoxStream.prototype.readCString = function() {
  var arr = [];
  while(true) {
    var b = this.readUint8();
    if (b !== 0) {
      arr.push(b);
    } else {
      break;
    }
  }
  return String.fromCharCode.apply(null, arr); 
}

MP4BoxStream.prototype.readInt8 = function() {
  return this.readAnyInt(1, true);
}

MP4BoxStream.prototype.readInt16 = function() {
  return this.readAnyInt(2, true);
}

MP4BoxStream.prototype.readInt32 = function() {
  return this.readAnyInt(4, true);
}

MP4BoxStream.prototype.readInt64 = function() {
  return this.readAnyInt(8, false);
}

MP4BoxStream.prototype.readUint8Array = function(length) {
  var arr = new Uint8Array(length);
  for (var i = 0; i < length; i++) {
    arr[i] = this.readUint8();
  }
  return arr;
}

MP4BoxStream.prototype.readInt16Array = function(length) {
  var arr = new Int16Array(length);
  for (var i = 0; i < length; i++) {
    arr[i] = this.readInt16();
  }
  return arr;
}

MP4BoxStream.prototype.readUint16Array = function(length) {
  var arr = new Int16Array(length);
  for (var i = 0; i < length; i++) {
    arr[i] = this.readUint16();
  }
  return arr;
}

MP4BoxStream.prototype.readUint32Array = function(length) {
  var arr = new Uint32Array(length);
  for (var i = 0; i < length; i++) {
    arr[i] = this.readUint32();
  }
  return arr;
}

MP4BoxStream.prototype.readInt32Array = function(length) {
  var arr = new Int32Array(length);
  for (var i = 0; i < length; i++) {
    arr[i] = this.readInt32();
  }
  return arr;
}

if (typeof exports !== 'undefined') {
  exports.MP4BoxStream = MP4BoxStream;
}
var MP4BoxStream = function(arrayBuffer) {
  if (arrayBuffer instanceof ArrayBuffer) {
    this.buffer = arrayBuffer;
    this.uint8 = new Uint8Array(arrayBuffer);
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
  var npos = Math.max(0, Math.min(this.uint8.length, pos));
  this.position = (isNaN(npos) || !isFinite(npos)) ? 0 : npos;
}

MP4BoxStream.prototype.isEos = function () {
  return this.getPosition() >= this.getEndPosition();
}

/*************************************************************************
  Read methods, simimar to DataStream but simpler
 *************************************************************************/

MP4BoxStream.prototype.readUint8 = function() {
  var u8;
  if (this.position + 1 <= this.uint8.length) {
    u8 = this.uint8[this.position];
    this.position++;
    return u8;
  } else {
    throw ("Not enough bytes in buffer");
  }
}

MP4BoxStream.prototype.readUint16 = function() {
  var u8_1, u8_2, u16;
  if (this.position + 2 <= this.uint8.length) {
    u8_1 = this.uint8[this.position];
    this.position++;
    u8_2 = this.uint8[this.position];
    this.position++;
    u16 = u8_1 << 8 | u8_2;
    return u16;
  } else {
    throw ("Not enough bytes in buffer");
  }
}

MP4BoxStream.prototype.readUint24 = function() {
  var u8, u24;
  if (this.position + 3 <= this.uint8.length) {
    u24 = this.uint8[this.position] << 16;
    this.position++;
    u24 |= this.uint8[this.position] << 8;
    this.position++;
    u24 |= this.uint8[this.position];
    this.position++;
    return u24;
  } else {
    throw ("Not enough bytes in buffer");
  }
}

MP4BoxStream.prototype.readUint32 = function() {
  var u8, u32;
  if (this.position + 4 <= this.uint8.length) {
    u32 = this.uint8[this.position] << 24;
    this.position++;
    u32 |= this.uint8[this.position] << 16;
    this.position++;
    u32 |= this.uint8[this.position] << 8;
    this.position++;
    u32 |= this.uint8[this.position];
    this.position++;
    return u32;
  } else {
    throw ("Not enough bytes in buffer");
  }
}

MP4BoxStream.prototype.readUint64 = function() {
  var u64;
  if (this.position + 8 <= this.uint8.length) {
    u64 = this.readUint32() << 32;
    u64 |= this.readUint32();
    return u64;
  } else {
    throw ("Not enough bytes in buffer");
  }
}

MP4BoxStream.prototype.readString = function(length) {
  if (this.position + length <= this.uint8.length) {
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
  return this.readUint8();
}

MP4BoxStream.prototype.readInt16 = function() {
  return this.readUint16();
}

MP4BoxStream.prototype.readInt32 = function() {
  return this.readUint32();
}

MP4BoxStream.prototype.readUint8Array = function(length) {
  var arr = [];
  for (var i = 0; i < length; i++) {
    arr[i] = this.readUint8();
  }
  return arr;
}

MP4BoxStream.prototype.readInt16Array = function(length) {
  var arr = [];
  for (var i = 0; i < length; i++) {
    arr[i] = this.readUint16();
  }
  return arr;
}

MP4BoxStream.prototype.readUint32Array = function(length) {
  var arr = [];
  for (var i = 0; i < length; i++) {
    arr[i] = this.readUint32();
  }
  return arr;
}

MP4BoxStream.prototype.readInt32Array = function(length) {
  var arr = [];
  for (var i = 0; i < length; i++) {
    arr[i] = this.readInt32();
  }
  return arr;
}

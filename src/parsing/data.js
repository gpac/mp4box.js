/*
 * itif data types
 * https://developer.apple.com/documentation/quicktime-file-format/well-known_types
 */
var ItifTypes = {
  RESERVED: 0,
  UTF8: 1,
  UTF16: 2,
  SJIS: 3,
  UTF8_SORT: 4,
  UTF16_SORT: 5,
  JPEG: 13,
  PNG: 14,
  BE_SIGNED_INT: 21,
  BE_UNSIGNED_INT: 22,
  BE_FLOAT32: 23,
  BE_FLOAT64: 24,
  BMP: 27,
  QT_ATOM: 28,
  BE_SIGNED_INT8: 65,
  BE_SIGNED_INT16: 66,
  BE_SIGNED_INT32: 67,
  BE_FLOAT32_POINT: 70,
  BE_FLOAT32_DIMENSIONS: 71,
  BE_FLOAT32_RECT: 72,
  BE_SIGNED_INT64: 74,
  BE_UNSIGNED_INT8: 75,
  BE_UNSIGNED_INT16: 76,
  BE_UNSIGNED_INT32: 77,
  BE_UNSIGNED_INT64: 78,
  BE_FLOAT64_AFFINE_TRANSFORM: 79,
};

/*
 * Parses the types above. Only implement the ones we actually
 * have real world test data for. Add a test case, as you implement them.
 */
function parseItifData(type, data) {
  if (type == ItifTypes.UTF8) {
    return new TextDecoder("utf-8").decode(data);
  }

  var view = new DataView(data.buffer);
  if (type == ItifTypes.BE_UNSIGNED_INT) {
    if (data.length == 1) {
      return view.getUint8(0);
    } else if (data.length == 2) {
      return view.getUint16(0, false);
    } else if (data.length == 4) {
      return view.getUint32(0, false);
    } else if (data.length == 8) {
      return view.getBigUint64(0, false);
    } else {
      throw new Error("Unsupported ITIF_TYPE_BE_UNSIGNED_INT length " + data.length);
    }
  } else if (type == ItifTypes.BE_SIGNED_INT) {
    if (data.length == 1) {
      return view.getInt8(0);
    } else if (data.length == 2) {
      return view.getInt16(0, false);
    } else if (data.length == 4) {
      return view.getInt32(0, false);
    } else if (data.length == 8) {
      return view.getBigInt64(0, false);
    } else {
      throw new Error("Unsupported ITIF_TYPE_BE_SIGNED_INT length " + data.length);
    }
  } else if (type == ItifTypes.BE_FLOAT32) {
    return view.getFloat32(0, false);
  }

  Log.warn("BoxParser", "Unsupported or unimplemented itif data type: " + type);
  return undefined;
}

/*
 * The QTFF data Atom is typically in an ilst Box.
 * https://developer.apple.com/documentation/quicktime-file-format/data_atom
 */
BoxParser.createBoxCtor("data", function(stream) {
  this.type  = stream.readUint32();
  this.country = stream.readUint16();
  if (this.country > 255) {
    stream.position -= 2;
    this.countryString = stream.readString(2);
  }
  this.language = stream.readUint16();
  if (this.language > 255) {
    stream.position -= 2;
    this.parseLanguage(stream);
  }
  this.raw = stream.readUint8Array(this.size - this.hdr_size - 8);
  this.value = parseItifData(this.type, this.raw);
});

if (typeof exports !== 'undefined') {
	exports.ItifTypes = ItifTypes;
}


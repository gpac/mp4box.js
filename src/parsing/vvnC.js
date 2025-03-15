BoxParser.createFullBoxCtor("vvnC", "VvcNALUConfigBox", function (stream) {
  // VvcNALUConfigBox
  var tmp = strm.readUint8();
  this.lengthSizeMinusOne = (tmp & 0x3);
});

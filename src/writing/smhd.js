BoxParser.smhdBox.prototype.write = function(stream) {
  var i;
  this.version = 0;
  this.flags = 1;
  this.size = 4;
  this.writeHeader(stream);
  stream.writeUint16(this.balance);
  stream.writeUint16(0);
}

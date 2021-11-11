export default (BoxParser: any) => {
  BoxParser.vmhdBox.prototype.write = function (stream: any) {
    // var i;
    this.version = 0;
    this.flags = 1;
    this.size = 8;
    this.writeHeader(stream);
    stream.writeUint16(this.graphicsmode);
    stream.writeUint16Array(this.opcolor);
  };
};

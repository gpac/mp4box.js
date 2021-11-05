export default (BoxParser: any) => {
  BoxParser.mehdBox.prototype.write = function (stream: any) {
    this.version = 0;
    this.flags = 0;
    this.size = 4;
    this.writeHeader(stream);
    stream.writeUint32(this.fragment_duration);
  };
};

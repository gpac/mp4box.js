export default (BoxParser: any) => {
  BoxParser['urn Box'].prototype.write = function (stream: any) {
    this.version = 0;
    this.flags = 0;
    this.size = this.name.length + 1 + (this.location ? this.location.length + 1 : 0);
    this.writeHeader(stream);
    stream.writeCString(this.name);
    if (this.location) {
      stream.writeCString(this.location);
    }
  };
};

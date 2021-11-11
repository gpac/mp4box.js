export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('urn ', function (this: any, stream: any) {
    this.name = stream.readCString();
    if (this.size - this.hdr_size - this.name.length - 1 > 0) {
      this.location = stream.readCString();
    }
  });
};

export default (BoxParser: any) => {
  BoxParser.createFullBoxCtor('elng', function (this: any, stream: any) {
    this.extended_language = stream.readString(this.size - this.hdr_size);
  });
};

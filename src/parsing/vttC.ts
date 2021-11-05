export default (BoxParser: any) => {
  BoxParser.createBoxCtor('vttC', function (this: any, stream: any) {
    this.text = stream.readString(this.size - this.hdr_size);
  });
};

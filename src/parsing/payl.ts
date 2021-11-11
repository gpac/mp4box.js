export default (BoxParser: any) => {
  BoxParser.createBoxCtor('payl', function (this: any, stream: any) {
    this.text = stream.readString(this.size - this.hdr_size);
  });
};

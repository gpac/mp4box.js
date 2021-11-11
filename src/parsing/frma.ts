export default (BoxParser: any) => {
  BoxParser.createBoxCtor('frma', function (this: any, stream: any) {
    this.data_format = stream.readString(4);
  });
};

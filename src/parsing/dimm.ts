export default (BoxParser: any) => {
  BoxParser.createBoxCtor('dimm', function (this: any, stream: any) {
    this.bytessent = stream.readUint64();
  });
};
